// Helper utilities to connect to the backend SignalR hub
import * as signalR from "@microsoft/signalr";
import { VixQuoteData } from "@/contexts/TradingContext"; // Import VixQuoteData type

export type SignalRCallbacks = {
  onBandDataUpdated: (data: any) => void;
  onHistoricalBandDataReceived: (data: any) => void;
  onPositionsUpdated: (data: any) => void;
  onOrdersUpdated: (data: any) => void;
  onOrderAdded: (data: any) => void; // not triggered by backend but kept for compatibility
  onOrderUpdated: (data: any) => void; // same as above
  onOrderDeleted: (data: any) => void; // same as above
  onServiceStatusUpdated: (data: any) => void;
  onLogAdded: (data: any) => void; // not triggered directly
  onLogsUpdated: (data: any) => void;
  onProgramStateUpdated: (data: any) => void;
  onQuoteUpdated: (data: any) => void;
  onVixQuoteUpdated: (data: VixQuoteData) => void; // Added for VIX data
  onSettingUpdated: (data: any) => void; // not triggered directly
};

export type SignalRConnection = signalR.HubConnection;

export const connectToSignalR = (callbacks: SignalRCallbacks): SignalRConnection => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5001/datahub")
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  connection.on("ReceiveBandData", callbacks.onBandDataUpdated);
  connection.on("ReceiveHistoricalBandData", callbacks.onHistoricalBandDataReceived);
  connection.on("ReceivePositions", callbacks.onPositionsUpdated);
  connection.on("ReceiveOrders", callbacks.onOrdersUpdated);
  connection.on("ReceiveServiceStatus", callbacks.onServiceStatusUpdated);
  connection.on("ReceiveLogs", callbacks.onLogAdded);
  connection.on("ReceiveProgramState", callbacks.onProgramStateUpdated);
  connection.on("ReceiveQuote", callbacks.onQuoteUpdated);
  connection.on("ReceiveVixQuote", callbacks.onVixQuoteUpdated); // Added listener for VIX quotes
  connection.on("LogsCleared", () => callbacks.onLogsUpdated([]));

  connection.start().then(async () => {
    console.log("Connected to SignalR hub");
    try {
      await connection.invoke("RequestCurrentState");
    } catch (err) {
      console.error("Failed to request current state", err);
    }
  }).catch(err => {
    console.error("Error connecting to SignalR hub:", err);
  });

  return connection;
};

export const disconnectFromSignalR = (connection: SignalRConnection) => {
  if (connection) {
    connection.stop().catch(err => console.error("Error stopping SignalR:", err));
  }
};

