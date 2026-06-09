<template>
  <div class="messages-page">
    <div class="messages-header">
      <div>
        <h1>Messenger</h1>
        <p>Chat with your friends in one place</p>
      </div>
    </div>

    <div class="messages-layout">
      <aside class="conversations-panel">
        <div class="panel-top">
          <div>
            <h2>Conversations</h2>
            <p>Recent chats and unread messages</p>
          </div>
        </div>

        <div class="conversation-search">
          <Icon icon="mdi:magnify" class="search-icon" />
          <input
            v-model="conversationSearch"
            type="text"
            placeholder="Search conversations"
          />
        </div>

        <div class="conversation-list">
          <div v-if="isLoadingConversations" class="loading-state">
            <Icon icon="mdi:loading" class="loading-icon" />
            Loading conversations...
          </div>

          <div v-else-if="conversations.length === 0" class="empty-state">
            <Icon icon="mdi:message-text-outline" class="empty-icon" />
            <h3>No conversations yet</h3>
            <p>Start a new chat by selecting a friend below.</p>
          </div>

          <button
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            class="conversation-item"
            :class="{ active: conversation.id === activeContactId }"
            @click="selectConversation(conversation)">
            <div class="conversation-avatar">
              <img v-if="conversation.avatar" :src="`http://localhost:3000${conversation.avatar}`" alt="Avatar" class="avatar-img" />
              <span v-else>{{ conversation.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="conversation-details">
              <div class="conversation-name">{{ conversation.name }}</div>
              <div class="conversation-snippet">{{ conversation.last_message }}</div>
            </div>
            <div class="conversation-meta">
              <span>{{ formatDate(conversation.last_at) }}</span>
              <span v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount }}
              </span>
            </div>
          </button>
        </div>

        <div class="new-chat-card">
          <div class="new-chat-header">
            <h3>Start a new chat</h3>
            <p>Select a friend to message</p>
          </div>
          <div v-if="isLoadingFriends" class="loading-state">
            <Icon icon="mdi:loading" class="loading-icon" />
            Loading friends...
          </div>
          <div v-else class="friend-list">
            <button
              v-for="friend in friends"
              :key="friend.id"
              class="friend-list-item"
              @click="selectFriend(friend)">
              <div class="friend-avatar">
                <img v-if="friend.avatar" :src="`http://localhost:3000${friend.avatar}`" alt="Avatar" class="avatar-img" />
                <span v-else>{{ friend.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div>
                <div class="friend-name">{{ friend.name }}</div>
                <div class="friend-status">Say hello</div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <section class="chat-panel">
        <div v-if="!activeContactId" class="chat-empty-state">
          <Icon icon="mdi:message-text-clock-outline" class="empty-icon" />
          <h2>Open a conversation</h2>
          <p>Select a chat thread or start a new conversation from the left.</p>
        </div>

        <div v-else class="chat-screen">
          <div class="chat-header">
            <div class="chat-avatar">
              <img v-if="activeProfile" :src="`http://localhost:3000${activeProfile}`" alt="Avatar" class="avatar-img" />
              <span v-else>{{ activeContactName.charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <h2>{{ activeContactName }}</h2>
              <p>Active now</p>
            </div>
          </div>

          <div class="chat-messages">
            <div v-if="isLoadingConversation" class="loading-state">
              <Icon icon="mdi:loading" class="loading-icon" />
              Loading chat...
            </div>

            <div v-else-if="conversationError" class="error-state">
              <Icon icon="mdi:alert-circle" class="error-icon" />
              <p>{{ conversationError }}</p>
            </div>

            <div v-else-if="messages.length === 0" class="empty-chat-message">
              <Icon icon="mdi:chat-plus-outline" class="empty-icon" />
              <h3>No messages yet</h3>
              <p>Send the first message to {{ activeContactName }}.</p>
            </div>

            <div v-else class="message-list">
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-bubble"
                :class="{ outgoing: message.sender_id === CURRENT_USER_ID, incoming: message.sender_id !== CURRENT_USER_ID }"
              >
                <p class="message-text">{{ message.content }}</p>
                <span class="message-time">{{ formatDateTime(message.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="chat-composer">
            <textarea
              v-model="newMessage"
              placeholder="Write a message..."
              rows="3"
              @keydown.enter.prevent="submitMessage"
            />
            <button class="btn-send" @click="submitMessage">
              <Icon icon="mdi:send" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { api } from '@/api/api';

interface ConversationSummary {
  id: number;
  name: string;
  avatar?: string; // ADDED
  last_message: string;
  last_at: string;
  unreadCount: number;
}

interface Friend {
  id: number;
  name: string;
  avatar?: string; // ADDED
}

interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
  is_read: number; // 0 for unread, 1 for read
}

const authUser = localStorage.getItem('auth_user');
const CURRENT_USER_ID = authUser ? JSON.parse(authUser).id : null;
const route = useRoute();
const router = useRouter();

const activeContactId = ref<number | null>(route.params.id ? parseInt(route.params.id as string, 10) : null);
const activeContactName = ref<string>('');
const activeProfile = ref<string | null>('');
const conversationSearch = ref('');
const conversations = ref<ConversationSummary[]>([]);
const friends = ref<Friend[]>([]);
const messages = ref<MessageItem[]>([]);
const newMessage = ref('');
const isLoadingConversations = ref(false);
const isLoadingFriends = ref(false);
const isLoadingConversation = ref(false);
const conversationError = ref<string | null>(null);

const chatMessagesRef = ref<HTMLElement | null>(null);

const isConnected = ref(false);
let socket: WebSocket | null = null;

const filteredConversations = computed(() => {
  if (!conversationSearch.value.trim()) return conversations.value;

  return conversations.value.filter((conversation) =>
    conversation.name.toLowerCase().includes(conversationSearch.value.toLowerCase()) ||
    conversation.last_message.toLowerCase().includes(conversationSearch.value.toLowerCase()),
  );
});

const formatDate = (isoDate: string) => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateTime = (isoDate: string) => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTo({
      top: chatMessagesRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const fetchConversations = async () => {
  isLoadingConversations.value = true;
  try {
    conversations.value = await api.getConversations();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingConversations.value = false;
  }
};

const fetchFriends = async () => {
  isLoadingFriends.value = true;
  try {
    friends.value = await api.getFriends();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingFriends.value = false;
  }
};

const markChatAsRead = async (contactId: number) => {
  try {
    // 1. Tell the server we read the messages
    await api.markAsRead(contactId);
    // 2. Update our local sidebar so the unread badge disappears
    await fetchConversations();
  } catch (error) {
    console.error("Failed to mark chat as read:", error);
  }
};

const fetchConversation = async (contactId: number) => {
  isLoadingConversation.value = true;
  conversationError.value = null;

  try {
    const response = await api.getConversation(contactId);
    messages.value = response.conversation;
    activeContactName.value = response.contact.name;
    
    scrollToBottom();

    // Mark as read immediately after loading the chat!
    markChatAsRead(contactId);
  } catch (err) {
    conversationError.value = 'Could not load this conversation.';
  } finally {
    isLoadingConversation.value = false;
  }
};

const selectConversation = (conversation: ConversationSummary) => {
  activeContactId.value = conversation.id;
  activeContactName.value = conversation.name;
  activeProfile.value = conversation.avatar ?? null;
  router.push({ name: 'messages', params: { id: conversation.id } });
};

const selectFriend = (friend: Friend) => {
  activeContactId.value = friend.id;
  activeContactName.value = friend.name;
  activeProfile.value = friend.avatar ?? null;
  router.push({ name: 'messages', params: { id: friend.id } });
};

const clearActiveContact = () => {
  activeContactId.value = null;
  activeContactName.value = '';
  router.push({ name: 'messages' }); 
};

const submitMessage = async () => {
  if (!activeContactId.value || !newMessage.value.trim()) return;

  const messageText = newMessage.value.trim();
  newMessage.value = ''; 

  try {
    const savedMessage = await api.sendMessage(activeContactId.value, messageText);
    
    if (savedMessage) {
        messages.value.push(savedMessage);
    } else {
        await fetchConversation(activeContactId.value);
    }

    scrollToBottom(); 
    await fetchConversations();
  } catch (err) {
    console.error('Failed to send message:', err);
    newMessage.value = messageText; 
  }
};

watch(
  () => route.params.id,
  (newId) => {
    if (!newId) {
      clearActiveContact();
      messages.value = [];
      return;
    }

    const contactId = parseInt(newId as string, 10);

    activeContactId.value = contactId;
    void fetchConversation(contactId);
  },
);

onMounted(async () => {
  await Promise.all([fetchConversations(), fetchFriends()]);
  if (activeContactId.value) {
    await fetchConversation(activeContactId.value);
  }

  socket = new WebSocket(`ws://localhost:3000?userId=${CURRENT_USER_ID}`);
  socket.onopen = () => { isConnected.value = true; };

  socket.onmessage = (event) => {
    try {
      // Expecting your backend to send a JSON with a 'type' property
      const incomingData = JSON.parse(event.data);

      // SCENARIO 1: The other person read our messages
      if (incomingData.type === 'read_receipt') {
        if (incomingData.reader_id === activeContactId.value) {
          // Update all our outgoing messages in this chat to "read" instantly
          messages.value.forEach(msg => {
            if (msg.sender_id === CURRENT_USER_ID) msg.is_read = 1;
          });
        }
        return; 
      }

      // SCENARIO 2: We received a new chat message
      if (incomingData.type === 'chat_message') {
        const message: MessageItem = incomingData.payload;
        
        const isForCurrentChat = 
          (message.sender_id === activeContactId.value && message.receiver_id === CURRENT_USER_ID) ||
          (message.sender_id === CURRENT_USER_ID && message.receiver_id === activeContactId.value);

        if (isForCurrentChat) {
          messages.value.push(message);
          scrollToBottom();

          // If we have the chat open and they sent a message, instantly mark it as read!
          if (message.receiver_id === CURRENT_USER_ID) {
             markChatAsRead(activeContactId.value);
          }
        } else {
          fetchConversations();
        }
      }
    } catch (e) {
      console.error("Could not parse incoming WebSocket message:", e);
    }
  };

  socket.onclose = () => { isConnected.value = false; };
});

onUnmounted(() => {
  if (socket) socket.close();
});
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  padding: 2rem;
  color: #1e293b;
}

.messages-header {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.messages-header h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.04em;
}

.messages-header p {
  margin: 0.5rem 0 0;
  color: #475569;
}

.messages-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}

.conversations-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-top,
.new-chat-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  padding: 1.25rem;
}

.panel-top h2,
.new-chat-header h3 {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
}

.panel-top p,
.new-chat-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.conversation-search {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
}

.search-icon {
  color: #94a3b8;
  margin-right: 0.75rem;
}

.conversation-search input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #1e293b;
  background: transparent;
}

.conversation-list {
  display: grid;
  gap: 0.75rem;
}

.conversation-item,
.friend-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  border: 1px solid transparent;
  background: white;
  transition: all 0.2s ease;
  text-align: left;
}

.conversation-item:hover,
.friend-list-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.conversation-item.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-color: #c7d2fe;
}

.conversation-avatar,
.friend-avatar,
.chat-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.conversation-details {
  flex: 1;
  min-width: 0;
}

.conversation-name,
.friend-name {
  margin: 0;
  font-weight: 600;
  color: #0f172a;
}

.conversation-snippet,
.friend-status {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
  display: block;
}

.conversation-meta {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  color: #94a3b8;
  font-size: 0.82rem;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 0.25rem 0.5rem;
  background: #6366f1;
  color: white;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.new-chat-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.friend-list {
  display: grid;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.friend-list-item {
  justify-content: flex-start;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-empty-state,
.loading-state,
.empty-state,
.error-state,
.empty-chat-message {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  padding: 2.5rem;
  text-align: center;
  color: #475569;
}

.chat-empty-state .empty-icon,
.empty-state .empty-icon,
.empty-chat-message .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-icon {
  font-size: 1.5rem;
  color: #6366f1;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-screen {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 640px;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 40px rgba(15, 23, 42, 0.06);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.chat-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.chat-messages {
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-bubble {
  max-width: 75%;
  padding: 1rem 1rem;
  border-radius: 20px;
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 0.45rem;
}

.message-bubble.incoming {
  align-self: flex-start;
  background: #f8fafc;
  color: #111827;
  border: 1px solid #e2e8f0;
}

.message-bubble.outgoing {
  align-self: flex-end;
  background: #6366f1;
  color: white;
}

.message-text {
  margin: 0;
  line-height: 1.6;
}

.message-time {
  font-size: 0.75rem;
  color: inherit;
  opacity: 0.75;
  align-self: flex-end;
}

.chat-composer {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.chat-composer textarea {
  width: 100%;
  min-height: 90px;
  max-height: 160px;
  border: 1px solid #cbd5e1;
  border-radius: 18px;
  padding: 1rem 1rem;
  resize: none;
  font-size: 0.95rem;
  color: #0f172a;
  outline: none;
}

.chat-composer textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.btn-send {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 1.2rem;
  border-radius: 16px;
  border: none;
  background: #6366f1;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-send:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

@media (max-width: 960px) {
  .messages-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .messages-page {
    padding: 1.5rem 1rem;
  }

  .conversations-panel,
  .chat-panel {
    width: 100%;
  }

  .chat-screen {
    min-height: 520px;
  }
}
</style>
