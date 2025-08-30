const axios = require('axios');

class MessageHandler {
  constructor(database, pageAccessToken) {
    this.db = database;
    this.pageAccessToken = pageAccessToken;
    this.apiUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;
  }

  async sendMessage(recipientId, message) {
    try {
      const response = await axios.post(this.apiUrl, {
        recipient: { id: recipientId },
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleMessage(senderId, message) {
    try {
      console.log(`Handling message for user ${senderId}:`, message);
      const user = await this.db.getUser(senderId);
      const userState = await this.db.getUserState(senderId);
      
      console.log(`User exists: ${!!user}, User setup completed: ${user?.setup_completed}, User state: ${userState?.current_step}`);

      if (!user || !user.setup_completed) {
        await this.handleProfileSetup(senderId, message, userState);
      } else {
        await this.handleMainCommands(senderId, message, user);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await this.sendMessage(senderId, {
        text: "Sorry, something went wrong. Please try again! 😅"
      });
    }
  }

  async handlePostback(senderId, postback) {
    try {
      const payload = JSON.parse(postback.payload);
      
      switch (payload.action) {
        case 'rate_couple':
          await this.handleCoupleRating(senderId, payload);
          break;
        case 'view_more_couples':
          await this.showRandomCouple(senderId);
          break;
        case 'select_gender':
          await this.handleGenderSelection(senderId, payload.gender);
          break;
        case 'select_preference':
          await this.handlePreferenceSelection(senderId, payload.preference);
          break;
        default:
          console.log('Unknown postback:', payload);
      }
    } catch (error) {
      console.error('Error handling postback:', error);
    }
  }

  async handleProfileSetup(senderId, message, userState) {
    const currentStep = userState.current_step;
    const tempData = JSON.parse(userState.temp_data || '{}');

    switch (currentStep) {
      case 'START':
        await this.startProfileSetup(senderId);
        break;
      case 'AWAITING_GENDER':
        await this.askGender(senderId);
        break;
      case 'AWAITING_PREFERENCE':
        await this.askPreference(senderId);
        break;
      case 'AWAITING_PHOTO':
        await this.handlePhotoUpload(senderId, message, tempData);
        break;
      case 'AWAITING_SUMMARY':
        await this.handleSummaryInput(senderId, message, tempData);
        break;
      default:
        await this.startProfileSetup(senderId);
    }
  }

  async startProfileSetup(senderId) {
    await this.sendMessage(senderId, {
      text: "Welcome to Duet! 💕 Let's set up your profile so you can start rating cute couples and find your matches!"
    });
    
    setTimeout(async () => {
      await this.askGender(senderId);
    }, 1000);
  }

  async askGender(senderId) {
    await this.db.updateUserState(senderId, 'AWAITING_GENDER');
    
    await this.sendMessage(senderId, {
      text: "First, what's your gender?",
      quick_replies: [
        {
          content_type: "text",
          title: "Man",
          payload: JSON.stringify({ action: "select_gender", gender: "Man" })
        },
        {
          content_type: "text",
          title: "Woman",
          payload: JSON.stringify({ action: "select_gender", gender: "Woman" })
        }
      ]
    });
  }

  async handleGenderSelection(senderId, gender) {
    const tempData = { gender };
    await this.db.updateUserState(senderId, 'AWAITING_PREFERENCE', tempData);
    await this.askPreference(senderId);
  }

  async askPreference(senderId) {
    await this.sendMessage(senderId, {
      text: "What are you looking for?",
      quick_replies: [
        {
          content_type: "text",
          title: "Looking for a Man",
          payload: JSON.stringify({ action: "select_preference", preference: "Looking for a Man" })
        },
        {
          content_type: "text",
          title: "Looking for a Woman",
          payload: JSON.stringify({ action: "select_preference", preference: "Looking for a Woman" })
        }
      ]
    });
  }

  async handlePreferenceSelection(senderId, preference) {
    const userState = await this.db.getUserState(senderId);
    const tempData = JSON.parse(userState.temp_data || '{}');
    tempData.preference = preference;
    
    await this.db.updateUserState(senderId, 'AWAITING_PHOTO', tempData);
    await this.sendMessage(senderId, {
      text: "Great! Now please upload your profile photo 📸"
    });
  }

  async handlePhotoUpload(senderId, message, tempData) {
    if (message.attachments && message.attachments[0] && message.attachments[0].type === 'image') {
      tempData.photo_url = message.attachments[0].payload.url;
      await this.db.updateUserState(senderId, 'AWAITING_SUMMARY', tempData);
      
      await this.sendMessage(senderId, {
        text: "Perfect! 📱 Now write a short summary about yourself (1-2 sentences):"
      });
    } else {
      await this.sendMessage(senderId, {
        text: "Please upload an image for your profile photo 📸"
      });
    }
  }

  async handleSummaryInput(senderId, message, tempData) {
    if (message.text) {
      tempData.summary = message.text;
      tempData.messenger_id = senderId;
      
      try {
        await this.db.createUser(tempData);
        await this.db.updateUserState(senderId, 'COMPLETED');
        
        await this.sendMessage(senderId, {
          text: "🎉 Profile complete! Welcome to Duet!\n\nCommands you can use:\n• Type 'View Couples' to rate couples\n• Type 'My Matches' to see your matches"
        });
        
        setTimeout(async () => {
          await this.showRandomCouple(senderId);
        }, 2000);
        
      } catch (error) {
        console.error('Error creating user:', error);
        await this.sendMessage(senderId, {
          text: "Sorry, there was an error creating your profile. Please try again!"
        });
      }
    } else {
      await this.sendMessage(senderId, {
        text: "Please write a short text summary about yourself:"
      });
    }
  }

  async handleMainCommands(senderId, message, user) {
    const text = message.text ? message.text.toLowerCase() : '';

    if (text.includes('view couples') || text.includes('couples')) {
      await this.showRandomCouple(senderId);
    } else if (text.includes('my matches') || text.includes('matches')) {
      await this.showMatches(senderId);
    } else if (text.includes('help')) {
      await this.sendHelpMessage(senderId);
    } else {
      await this.sendMessage(senderId, {
        text: "Commands:\n• 'View Couples' - Rate couples\n• 'My Matches' - See your matches\n• 'Help' - Show this menu"
      });
    }
  }

  async showRandomCouple(senderId) {
    try {
      const couple = await this.db.getRandomCouple();
      
      if (!couple || couple.length < 2) {
        await this.sendMessage(senderId, {
          text: "Not enough profiles yet! Invite more friends to join Duet! 💕"
        });
        return;
      }

      const [person1, person2] = couple;
      
      await this.sendMessage(senderId, {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: `${person1.gender === 'Man' ? '👨' : '👩'} Profile`,
                subtitle: person1.summary,
                image_url: person1.photo_url,
              },
              {
                title: `${person2.gender === 'Man' ? '👨' : '👩'} Profile`,
                subtitle: person2.summary,
                image_url: person2.photo_url,
              }
            ]
          }
        }
      });

      setTimeout(async () => {
        await this.sendMessage(senderId, {
          text: "Do you think this is a cute couple? 💕",
          quick_replies: [
            {
              content_type: "text",
              title: "❤️ Yes!",
              payload: JSON.stringify({
                action: "rate_couple",
                person1_id: person1.messenger_id,
                person2_id: person2.messenger_id,
                rating: true
              })
            },
            {
              content_type: "text",
              title: "❌ No",
              payload: JSON.stringify({
                action: "rate_couple",
                person1_id: person1.messenger_id,
                person2_id: person2.messenger_id,
                rating: false
              })
            }
          ]
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error showing couple:', error);
      await this.sendMessage(senderId, {
        text: "Sorry, couldn't load couples right now. Try again! 😅"
      });
    }
  }

  async handleCoupleRating(senderId, payload) {
    try {
      await this.db.addRating(senderId, payload.person1_id, payload.person2_id, payload.rating);
      
      const response = payload.rating ? 
        "Thanks for the vote! ❤️" : 
        "Thanks for your honesty! 😊";
      
      await this.sendMessage(senderId, { text: response });
      
      setTimeout(async () => {
        await this.sendMessage(senderId, {
          text: "Want to see another couple?",
          quick_replies: [
            {
              content_type: "text",
              title: "Yes! 👀",
              payload: JSON.stringify({ action: "view_more_couples" })
            },
            {
              content_type: "text",
              title: "Show My Matches",
              payload: JSON.stringify({ action: "show_matches" })
            }
          ]
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error saving rating:', error);
      await this.sendMessage(senderId, {
        text: "Sorry, couldn't save your rating. Try again!"
      });
    }
  }

  async showMatches(senderId) {
    try {
      const matches = await this.db.getTopMatches(senderId);
      
      if (!matches || matches.length === 0) {
        await this.sendMessage(senderId, {
          text: "No matches yet! Keep rating couples to find your perfect match! 💕\n\nType 'View Couples' to start rating!"
        });
        return;
      }

      await this.sendMessage(senderId, {
        text: `🔥 Your top matches (${matches.length}):`
      });

      const elements = matches.slice(0, 10).map(match => ({
        title: `${match.gender === 'Man' ? '👨' : '👩'} ${match.match_score} votes`,
        subtitle: match.summary,
        image_url: match.photo_url
      }));

      await this.sendMessage(senderId, {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: elements
          }
        }
      });

      setTimeout(async () => {
        await this.sendMessage(senderId, {
          text: "Want to rate more couples to find more matches?",
          quick_replies: [
            {
              content_type: "text",
              title: "Yes! 💕",
              payload: JSON.stringify({ action: "view_more_couples" })
            }
          ]
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error showing matches:', error);
      await this.sendMessage(senderId, {
        text: "Sorry, couldn't load your matches right now. Try again! 😅"
      });
    }
  }

  async sendHelpMessage(senderId) {
    await this.sendMessage(senderId, {
      text: `🏠 Duet Dating App Help\n\n📝 Commands:\n• 'View Couples' - Rate random couples\n• 'My Matches' - See people you match with\n• 'Help' - Show this menu\n\n💡 How it works:\n1. Rate couples as cute or not\n2. When others vote you'd be cute with someone, they become your match!\n3. The more votes, the higher they rank in your matches!`
    });
  }
}

module.exports = MessageHandler;