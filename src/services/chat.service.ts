import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDocs,
  setDoc,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  targetId: string;
  targetType: 'vehicle';
  updatedAt: any;
}

export const chatService = {
  async getOrCreateConversation(buyerId: string, sellerId: string, vehicleId: string): Promise<string> {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', buyerId),
      where('targetId', '==', vehicleId),
      limit(1)
    );

    try {
      const querySnapshot = await getDocs(q);
      // Filter for sellerId as well since Firestore doesn't support multiple array-contains
      const existing = querySnapshot.docs.find(doc => doc.data().participants.includes(sellerId));
      
      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const newConv: Omit<Conversation, 'id'> = {
        participants: [buyerId, sellerId],
        targetId: vehicleId,
        targetType: 'vehicle',
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(conversationsRef, newConv);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'conversations');
      return '';
    }
  },

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const conversationRef = doc(db, 'conversations', conversationId);

    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        conversationId,
        senderId,
        text,
        createdAt: serverTimestamp()
      };

      await addDoc(messagesRef, messageData);
      
      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}/messages`);
    }
  },

  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
    });
  }
};
