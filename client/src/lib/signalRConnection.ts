// A simplified SignalR client implementation using WebSockets
// This simulates the SignalR client functionality for our trading platform

export type SignalRCallbacks = {
  onBandDataUpdated: (data: any) => void;
  onPositionsUpdated: (data: any) => void;
  onOrdersUpdated: (data: any) => void;
  onOrderAdded: (data: any) => void;
  onOrderUpdated: (data: any) => void;
  onOrderDeleted: (data: any) => void;
  onServiceStatusUpdated: (data: any) => void;
  onLogAdded: (data: any) => void;
  onLogsUpdated: (data: any) => void;
  onProgramStateUpdated: (data: any) => void;
  onQuoteUpdated: (data: any) => void;
  onSettingUpdated: (data: any) => void;
};

export type SignalRConnection = {
  socket: WebSocket;
  isConnected: boolean;
  reconnectAttempts: number;
  callbacks: SignalRCallbacks;
};

let reconnectTimeout: NodeJS.Timeout | null = null;

// Establish connection to the WebSocket server
export const connectToSignalR = (callbacks: SignalRCallbacks): SignalRConnection => {
  // Since we're running from the same host, use current host for WebSocket
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/trading-ws`; // Use custom path
  
  const connection: SignalRConnection = {
    socket: new WebSocket(wsUrl),
    isConnected: false,
    reconnectAttempts: 0,
    callbacks
  };
  
  // Handle socket events
  connection.socket.onopen = () => {
    console.log('SignalR connection established');
    connection.isConnected = true;
    connection.reconnectAttempts = 0;
    
    // Clear any pending reconnect attempts
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };
  
  connection.socket.onclose = () => {
    console.log('SignalR connection closed');
    connection.isConnected = false;
    
    // Try to reconnect
    scheduleReconnect(connection);
  };
  
  connection.socket.onerror = (error) => {
    console.error('SignalR connection error:', error);
    // Error will trigger onclose, which will handle reconnection
  };
  
  connection.socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Route the message to the appropriate callback based on message type
      switch (message.type) {
        case 'bandDataUpdated':
          callbacks.onBandDataUpdated(message.data);
          break;
        case 'positionsUpdated':
          callbacks.onPositionsUpdated(message.data);
          break;
        case 'ordersUpdated':
          callbacks.onOrdersUpdated(message.data);
          break;
        case 'orderAdded':
          callbacks.onOrderAdded(message.data);
          break;
        case 'orderUpdated':
          callbacks.onOrderUpdated(message.data);
          break;
        case 'orderDeleted':
          callbacks.onOrderDeleted(message.data);
          break;
        case 'serviceStatusUpdated':
          callbacks.onServiceStatusUpdated(message.data);
          break;
        case 'logAdded':
          callbacks.onLogAdded(message.data);
          break;
        case 'logsUpdated':
          callbacks.onLogsUpdated(message.data);
          break;
        case 'programStateUpdated':
          callbacks.onProgramStateUpdated(message.data);
          break;
        case 'quoteUpdated':
          callbacks.onQuoteUpdated(message.data);
          break;
        case 'settingUpdated':
          callbacks.onSettingUpdated(message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing SignalR message:', error);
    }
  };
  
  return connection;
};

// Disconnect from SignalR
export const disconnectFromSignalR = (connection: SignalRConnection) => {
  if (connection?.socket) {
    connection.socket.close();
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
};

// Send a message to the server
export const sendSignalRMessage = (connection: SignalRConnection, type: string, data: any) => {
  if (connection.isConnected) {
    connection.socket.send(JSON.stringify({ type, data }));
  } else {
    console.warn('Cannot send message, SignalR connection is not established');
  }
};

// Schedule reconnection with exponential backoff
const scheduleReconnect = (connection: SignalRConnection) => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  const maxAttempts = 10;
  
  if (connection.reconnectAttempts < maxAttempts) {
    const delay = Math.min(30000, Math.pow(2, connection.reconnectAttempts) * 1000);
    
    console.log(`Scheduling SignalR reconnect in ${delay}ms (attempt ${connection.reconnectAttempts + 1})`);
    
    reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect to SignalR (attempt ${connection.reconnectAttempts + 1})`);
      
      // Create a new WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/trading-ws`;
      
      connection.socket = new WebSocket(wsUrl);
      connection.reconnectAttempts++;
      
      // Re-attach event handlers
      connection.socket.onopen = () => {
        console.log('SignalR connection re-established');
        connection.isConnected = true;
        connection.reconnectAttempts = 0;
      };
      
      connection.socket.onclose = () => {
        console.log('SignalR reconnection attempt failed');
        connection.isConnected = false;
        scheduleReconnect(connection);
      };
      
      connection.socket.onerror = (error) => {
        console.error('SignalR reconnection error:', error);
      };
      
      connection.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Route the message to the appropriate callback
          switch (message.type) {
            case 'bandDataUpdated':
              connection.callbacks.onBandDataUpdated(message.data);
              break;
            case 'positionsUpdated':
              connection.callbacks.onPositionsUpdated(message.data);
              break;
            case 'ordersUpdated':
              connection.callbacks.onOrdersUpdated(message.data);
              break;
            case 'orderAdded':
              connection.callbacks.onOrderAdded(message.data);
              break;
            case 'orderUpdated':
              connection.callbacks.onOrderUpdated(message.data);
              break;
            case 'orderDeleted':
              connection.callbacks.onOrderDeleted(message.data);
              break;
            case 'serviceStatusUpdated':
              connection.callbacks.onServiceStatusUpdated(message.data);
              break;
            case 'logAdded':
              connection.callbacks.onLogAdded(message.data);
              break;
            case 'logsUpdated':
              connection.callbacks.onLogsUpdated(message.data);
              break;
            case 'programStateUpdated':
              connection.callbacks.onProgramStateUpdated(message.data);
              break;
            case 'quoteUpdated':
              connection.callbacks.onQuoteUpdated(message.data);
              break;
            case 'settingUpdated':
              connection.callbacks.onSettingUpdated(message.data);
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing SignalR message:', error);
        }
      };
    }, delay);
  } else {
    console.error(`Failed to reconnect to SignalR after ${maxAttempts} attempts`);
  }
};
