// pages/chat/chat.js
const app = getApp()

Page({
  data: {
    messages: [],
    inputText: ''
  },

  onLoad() {
    this.setData({
      messages: app.globalData.chatMessages || []
    })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage() {
    if (!this.data.inputText.trim()) return
    
    const newMsg = {
      id: Date.now(),
      user: app.globalData.userInfo?.nickName || '我',
      text: this.data.inputText,
      time: Date.now()
    }
    
    const messages = [...this.data.messages, newMsg]
    this.setData({ messages, inputText: '' })
    app.globalData.chatMessages = messages
  }
})
