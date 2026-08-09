// src/api/socketService.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, API_BASE_URL } from './apiClient';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectionPromise = null;
  }

  async connect() {
    try {
      // If already connecting, return the existing promise
      if (this.connectionPromise) {
        return this.connectionPromise;
      }

      // If already connected, return the socket
      if (this.socket && this.connected) {
        return this.socket;
      }

      // Get token using the getToken function from apiClient
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Connecting to socket server...');
      
      // Create a new promise for the connection
      this.connectionPromise = new Promise((resolve, reject) => {
        // Derive socket URL from the API_BASE_URL
        const socketUrl = API_BASE_URL.replace(/\/api\/?$/, '');

        this.socket = io(socketUrl, {
          auth: {
            token, // raw token
            token_bearer: `Bearer ${token}`,
            Authorization: `Bearer ${token}`,
            authorization: `Bearer ${token}`,
            accessToken: token
          },
          query: {
            token, // raw token
            access_token: token,
            authToken: token,
            Authorization: `Bearer ${token}`,
            authorization: `Bearer ${token}`
          },
          extraHeaders: {
            Authorization: `Bearer ${token}`
          },
          transports: ['polling', 'websocket'],
          timeout: 5000,
          forceNew: true,
          reconnection: true, // Let socket.io handle reconnections natively
          reconnectionAttempts: 3
        });

        // Set up event handlers
        this.socket.on('connect', () => {
          console.log('Connected to chat server');
          this.connected = true;
          this.connectionPromise = null; // Clear the promise
          resolve(this.socket);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from chat server');
          this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
          this.connected = false;
          // Clear promise so future calls can retry
          this.connectionPromise = null; 
          reject(error);
        });

        this.socket.on('error', (error) => {
          this.connected = false;
        });
      });

      return this.connectionPromise;
    } catch (error) {
      this.connectionPromise = null; // Clear the promise
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.connectionPromise = null;
      this.reconnectAttempts = 0;
    }
  }

  joinConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('joinRoom', conversationId);
      console.log(`Joined conversation room: ${conversationId}`);
    } else {
      console.warn('Socket not connected, cannot join conversation');
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('leaveRoom', conversationId);
      console.log(`Left conversation room: ${conversationId}`);
    } else {
      console.warn('Socket not connected, cannot leave conversation');
    }
  }

  sendMessage(conversationId, content) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log(`Sending message via socket: ${conversationId}, ${content}`);

      // Send the message - the server will emit 'newMessage' event
      this.socket.emit('sendMessage', {
        conversationId,
        content
      });

      // Resolve immediately since we're using optimistic updates
      // The actual message will come through the 'newMessage' event
      resolve();
    });
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', (message) => {
        console.log('Received newMessage event:', message);
        callback(message);
      });
      console.log('Listening for newMessage events');
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('newMessage', callback);
      console.log('Stopped listening for newMessage events');
    }
  }
}

export default new SocketService();