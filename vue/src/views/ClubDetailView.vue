<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { api } from '../api/api';

const route = useRoute();
const router = useRouter();

const club = ref<any | null>(null);
const members = ref<any[]>([]);
const joinRequests = ref<any[]>([]);
const events = ref<any[]>([]);
const currentTab = ref<'about' | 'members' | 'events' | 'requests'>('about');
const loading = ref(true);
const currentUser = ref<any | null>(null);
const joinRequestSent = ref(false);
const eventFormError = ref('');

// Event modal state
const showEventModal = ref(false);
const editingEvent = ref<any | null>(null);
const eventForm = ref({
  title: '',
  description: '',
  event_date: '',
  location: ''
});

// About modal state
const showAboutModal = ref(false);
const aboutForm = ref({
  title: '',
  description: ''
});

// Get current user info
onMounted(async () => {
  try {
    currentUser.value = await api.getProfile();
  } catch (err) {
    console.error('Failed to get current user:', err);
  }
});

const clubId = Number(route.params.id);
const storageKey = `club_request_${clubId}`;

const isAdmin = computed(() => {
  if (!currentUser.value || !club.value) return false;
  const userMember = members.value.find(m => m.profile_id === currentUser.value.id);
  return userMember?.role === 'admin';
});

const isMember = computed(() => {
  return members.value.some(m => m.profile_id === currentUser.value?.id);
});

const load = async () => {
  loading.value = true;
  try {
    club.value = await api.getClubById(clubId);
    members.value = await api.getClubMembers(clubId);
    events.value = await api.getClubEvents(clubId);
    
    // Ensure we have current user info (best-effort)
    if (!currentUser.value) {
      try {
        currentUser.value = await api.getProfile();
      } catch (e) {
        // ignore - user may be unauthenticated
      }
    }

    // Check membership; clear saved request if already a member
    const localFlagExists = localStorage.getItem(storageKey) === 'true';

    if (isMember.value) {
      joinRequestSent.value = false;
      localStorage.removeItem(storageKey);
    } else if (currentUser.value) {
      // Ask server if the current user already has a pending request
      try {
        const status = await api.getClubRequestStatus(clubId);
        joinRequestSent.value = !!status.requested;
        if (joinRequestSent.value) localStorage.setItem(storageKey, 'true');
      } catch (e) {
        // Fallback to localStorage if server check fails
        joinRequestSent.value = localFlagExists;
      }
    } else {
      // Not authenticated: rely on localStorage
      joinRequestSent.value = localFlagExists;
    }
    
    if (isAdmin.value) {
      joinRequests.value = await api.getClubJoinRequests(clubId);
    }
  } catch (err) {
    console.error('Failed to load club:', err);
  } finally {
    loading.value = false;
  }
};

const joinClub = async () => {
  try {
    await api.joinClub(clubId);
    await load();
  } catch (err) {
    console.error('Failed to join club:', err);
  }
};

const requestJoinClub = async () => {mysql -u your_user -p your_database < fix-club-events-table.sql
  // Optimistic UI: mark as requested immediately
  joinRequestSent.value = true;
  localStorage.setItem(storageKey, 'true');
  try {
    await api.requestJoinClub(clubId);
  } catch (err) {
    console.error('Failed to request join:', err);
    // revert UI state on failure
    joinRequestSent.value = false;
    localStorage.removeItem(storageKey);
  }
};

const approveRequest = async (requestId: number) => {
  try {
    await api.approveJoinRequest(clubId, requestId);
    await load();
  } catch (err) {
    console.error('Failed to approve request:', err);
  }
};

const declineRequest = async (requestId: number) => {
  try {
    await api.declineJoinRequest(clubId, requestId);
    await load();
  } catch (err) {
    console.error('Failed to decline request:', err);
  }
};

const removeMember = async (memberId: number) => {
  if (confirm('Remove this member from the club?')) {
    try {
      await api.removeClubMember(clubId, memberId);
      await load();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  }
};

const changeRole = async (memberId: number, newRole: 'admin' | 'member') => {
  try {
    await api.changeClubMemberRole(clubId, memberId, newRole);
    await load();
  } catch (err) {
    console.error('Failed to change role:', err);
  }
};

const openEventModal = (event: any = null) => {
  eventFormError.value = '';
  if (event) {
    editingEvent.value = event;
    eventForm.value = { ...event };
  } else {
    editingEvent.value = null;
    eventForm.value = { title: '', description: '', event_date: '', location: '' };
  }
  showEventModal.value = true;
};

const closeEventModal = () => {
  showEventModal.value = false;
  editingEvent.value = null;
  eventFormError.value = '';
};

const saveEvent = async () => {
  eventFormError.value = '';
  
  if (!eventForm.value.title || !eventForm.value.title.trim()) {
    eventFormError.value = 'Event title is required.';
    return;
  }
  
  if (!eventForm.value.event_date) {
    eventFormError.value = 'Event date and time are required.';
    return;
  }

  if (!isAdmin.value) {
    eventFormError.value = 'You must be a club moderator to create events.';
    return;
  }

  try {
    console.log('Saving event', { clubId, event: eventForm.value, isAdmin: isAdmin.value, currentUser: currentUser.value });
    
    if (editingEvent.value) {
      await api.updateClubEvent(clubId, editingEvent.value.id, eventForm.value);
    } else {
      await api.createClubEvent(clubId, eventForm.value);
    }
    await load();
    closeEventModal();
  } catch (err: any) {
    console.error('Failed to save event:', err);
    
    // Provide specific error messages based on response status
    if (err.response?.status === 403) {
      eventFormError.value = 'You do not have permission to create events. Only moderators can do this.';
    } else if (err.response?.status === 401) {
      eventFormError.value = 'Your session has expired. Please log in again.';
    } else if (err.response?.data?.error) {
      eventFormError.value = err.response.data.error;
    } else if (err.response?.data?.message) {
      eventFormError.value = err.response.data.message;
    } else if (err.response?.statusText) {
      eventFormError.value = `Server error: ${err.response.statusText}`;
    } else if (err.message) {
      eventFormError.value = err.message;
    } else {
      eventFormError.value = 'Unable to save event. Please try again.';
    }
  }
};

const deleteEvent = async (eventId: number) => {
  if (confirm('Delete this event?')) {
    try {
      await api.deleteClubEvent(clubId, eventId);
      await load();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  }
};

const openAboutModal = () => {
  aboutForm.value = {
    title: club.value?.title || '',
    description: club.value?.description || ''
  };
  showAboutModal.value = true;
};

const closeAboutModal = () => {
  showAboutModal.value = false;
};

const saveAbout = async () => {
  try {
    await api.updateClub(clubId, aboutForm.value);
    await load();
    closeAboutModal();
  } catch (err) {
    console.error('Failed to save about:', err);
  }
};

const back = () => router.push({ name: 'clubs' });

const gotoProfile = (profileId: number) => {
  router.push({ name: 'profile', params: { id: String(profileId) } });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  load();
});
</script>

<template>
  <div class="club-detail-page">
    <!-- Banner -->
    <div class="club-banner">
      <img src="https://via.placeholder.com/1200x300/4f46e5/ffffff?text=Club+Banner" alt="Club Banner" />
      <button class="back-btn" @click="back">
        <Icon icon="mdi:arrow-left" />
      </button>
    </div>

    <div class="club-container">
      <!-- Header Section -->
      <div v-if="club" class="club-header">
        <div class="club-info">
          <h1>{{ club.title }}</h1>
          <p class="club-meta">
            <Icon icon="mdi:account-group" />
            {{ members.length }} members
          </p>
          <p class="club-description">{{ club.description }}</p>
        </div>
        <div class="club-actions">
          <button v-if="!isMember" class="button-primary" @click="requestJoinClub" :disabled="joinRequestSent">
            <Icon icon="mdi:plus" /> {{ joinRequestSent ? 'Requested to Join' : 'Request to Join' }}
          </button>
          <button v-else class="button-secondary" disabled>
            <Icon icon="mdi:check" /> Member
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="club-nav">
        <button
          :class="{ active: currentTab === 'about' }"
          @click="currentTab = 'about'"
          class="tab-btn"
        >
          About
        </button>
        <button
          :class="{ active: currentTab === 'members' }"
          @click="currentTab = 'members'"
          class="tab-btn"
        >
          Members
        </button>
        <button
          :class="{ active: currentTab === 'events' }"
          @click="currentTab = 'events'"
          class="tab-btn"
        >
          Events
        </button>
        <button
          v-if="isAdmin"
          :class="{ active: currentTab === 'requests' }"
          @click="currentTab = 'requests'"
          class="tab-btn"
        >
          <Icon icon="mdi:bell" /> Requests
        </button>
      </div>

      <!-- Content Area -->
      <div class="club-content">
        <!-- About Tab -->
        <div v-if="currentTab === 'about'" class="tab-content">
          <div class="content-card">
            <h3>About this group</h3>
            <p>{{ club?.description || 'No description available.' }}</p>
            <div v-if="isAdmin" class="admin-section">
              <button class="button-secondary-small" @click="openAboutModal">
                <Icon icon="mdi:pencil" /> Edit About
              </button>
            </div>
          </div>
        </div>

        <!-- Members Tab -->
        <div v-if="currentTab === 'members'" class="tab-content">
          <div class="members-grid">
            <div
              v-for="member in members"
              :key="member.id"
              class="member-card"
            >
              <div
                class="member-avatar"
                @click="gotoProfile(member.profile_id)"
              >
                {{ member.profile_name ? member.profile_name.charAt(0) : '?' }}
              </div>
              <div class="member-info">
                <div
                  class="member-name"
                  @click="gotoProfile(member.profile_id)"
                >
                  {{ member.profile_name || 'Unknown' }}
                </div>
                <div class="member-role">
                  <span v-if="member.role === 'admin'" class="admin-badge">
                    <Icon icon="mdi:shield-account" /> Moderator
                  </span>
                  <span v-else class="member-badge">Member</span>
                </div>
              </div>
              <div v-if="isAdmin && member.profile_id !== currentUser?.id" class="member-actions">
                <button 
                  v-if="member.role !== 'admin'"
                  class="action-btn promote" 
                  title="Make moderator"
                  @click="changeRole(member.id, 'admin')"
                >
                  <Icon icon="mdi:shield-plus-outline" />
                </button>
                <button 
                  v-else
                  class="action-btn demote" 
                  title="Remove moderator"
                  @click="changeRole(member.id, 'member')"
                >
                  <Icon icon="mdi:shield-minus-outline" />
                </button>
                <button 
                  class="action-btn remove" 
                  title="Remove member"
                  @click="removeMember(member.id)"
                >
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-if="currentTab === 'events'" class="tab-content">
          <div class="events-section">
            <h3>Upcoming Events</h3>
            <div v-if="events.length === 0" class="no-events">
              <Icon icon="mdi:calendar-blank" />
              <p>No events scheduled yet</p>
            </div>
            <div v-else class="events-list">
              <div v-for="event in events" :key="event.id" class="event-card">
                <div class="event-header">
                  <div class="event-title">{{ event.title }}</div>
                  <div v-if="isAdmin" class="event-actions">
                    <button class="action-btn" title="Edit" @click="openEventModal(event)">
                      <Icon icon="mdi:pencil" />
                    </button>
                    <button class="action-btn remove" title="Delete" @click="deleteEvent(event.id)">
                      <Icon icon="mdi:trash-can-outline" />
                    </button>
                  </div>
                </div>
                <p v-if="event.description" class="event-description">{{ event.description }}</p>
                <div class="event-details">
                  <div class="event-detail">
                    <Icon icon="mdi:calendar" />
                    {{ formatDate(event.event_date) }}
                  </div>
                  <div v-if="event.location" class="event-detail">
                    <Icon icon="mdi:map-marker" />
                    {{ event.location }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="isAdmin" class="admin-section">
              <button class="button-secondary-small" @click="openEventModal()">
                <Icon icon="mdi:plus" /> Create Event
              </button>
            </div>
          </div>
        </div>

        <!-- Requests Tab (Admin Only) -->
        <div v-if="currentTab === 'requests' && isAdmin" class="tab-content">
          <div class="requests-section">
            <h3>Join Requests</h3>
            <div v-if="joinRequests.length === 0" class="no-requests">
              <Icon icon="mdi:inbox-multiple" />
              <p>No pending requests</p>
            </div>
            <div v-else>
              <div v-for="req in joinRequests" :key="req.id" class="request-card">
                <div class="request-user">
                  <div class="user-avatar">
                    {{ req.user_name ? req.user_name.charAt(0) : '?' }}
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ req.user_name }}</div>
                    <div class="request-date">Requested {{ formatDate(req.created_at) }}</div>
                  </div>
                </div>
                <div class="request-actions">
                  <button class="button-primary-small" @click="approveRequest(req.id)">Approve</button>
                  <button class="button-secondary-small" @click="declineRequest(req.id)">Decline</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="modal-overlay" @click="closeEventModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingEvent ? 'Edit Event' : 'Create Event' }}</h2>
          <button class="close-btn" @click="closeEventModal">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div v-if="eventFormError" class="form-error">{{ eventFormError }}</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Event Title *</label>
            <input v-model="eventForm.title" type="text" placeholder="Enter event title" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="eventForm.description" placeholder="Enter event description" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>Date & Time *</label>
            <input v-model="eventForm.event_date" type="datetime-local" />
          </div>
          <div class="form-group">
            <label>Location</label>
            <input v-model="eventForm.location" type="text" placeholder="Enter event location" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="button-secondary-small" @click="closeEventModal" type="button">Cancel</button>
          <button class="button-primary" @click="saveEvent" type="button">{{ editingEvent ? 'Update' : 'Create' }} Event</button>
        </div>
      </div>
    </div>

    <!-- About Modal -->
    <div v-if="showAboutModal" class="modal-overlay" @click="closeAboutModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit About</h2>
          <button class="close-btn" @click="closeAboutModal">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Club Title *</label>
            <input v-model="aboutForm.title" type="text" placeholder="Enter club title" />
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea v-model="aboutForm.description" placeholder="Enter club description" rows="6"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="button-secondary-small" @click="closeAboutModal">Cancel</button>
          <button class="button-primary" @click="saveAbout">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.club-detail-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding-bottom: 40px;
}

.club-banner {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f0f2f5;
  overflow: hidden;
}

.club-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: white;
  transform: scale(1.05);
}

.club-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.club-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: -60px;
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.club-info {
  flex: 1;
}

.club-header h1 {
  margin: 0 0 8px;
  font-size: 2rem;
  color: #111827;
  font-weight: 900;
}

.club-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0 0 12px;
}

.club-description {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.98rem;
}

.club-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.button-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.button-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f0f2f5;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.6;
}

.club-nav {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  background: none;
  border: none;
  color: #6b7280;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.tab-btn:hover:not(.active) {
  color: #111827;
}

.club-content {
  margin-top: 24px;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content-card h3 {
  margin: 0 0 16px;
  font-size: 1.2rem;
  color: #111827;
}

.content-card p {
  margin: 0;
  color: #4b5563;
  line-height: 1.7;
}

.admin-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.button-secondary-small {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0f2f5;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary-small:hover {
  background: #e5e7eb;
}

.button-primary-small {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary-small:hover {
  background: #4338ca;
}

/* Members Grid */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.member-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.member-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.member-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-avatar:hover {
  background: #4338ca;
  transform: scale(1.05);
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 700;
  color: #111827;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-bottom: 4px;
}

.member-name:hover {
  color: #4f46e5;
}

.member-role {
  font-size: 0.85rem;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.member-badge {
  color: #6b7280;
  font-size: 0.85rem;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #dc2626;
}

.action-btn.remove:hover {
  border-color: #dc2626;
  background: #fee2e2;
}

/* Events Section */
.events-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.events-section h3 {
  margin: 0 0 24px;
  font-size: 1.2rem;
  color: #111827;
}

.no-events,
.no-requests {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.no-events svg,
.no-requests svg {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-events p,
.no-requests p {
  margin: 0;
  font-size: 1rem;
}

/* Requests Section */
.requests-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.requests-section h3 {
  margin: 0 0 24px;
  font-size: 1.2rem;
  color: #111827;
}

.request-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.request-card:hover {
  background: #f9fafb;
}

.request-user {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 700;
  color: #111827;
  font-size: 0.95rem;
}

.request-date {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 2px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

/* Events List */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.event-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.event-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.event-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #111827;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.event-actions .action-btn {
  width: 32px;
  height: 32px;
}

.event-description {
  color: #4b5563;
  font-size: 0.95rem;
  margin: 12px 0;
  line-height: 1.5;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.event-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #111827;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f2f5;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

/* Form Error */
.form-error {
  padding: 12px 24px;
  background: #fee2e2;
  border-left: 4px solid #dc2626;
  color: #991b1b;
  font-weight: 500;
  margin: 0;
  font-size: 0.9rem;
}

/* Button styles for role changes */
.action-btn.promote:hover {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.action-btn.demote:hover {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

@media (max-width: 768px) {
  .club-header {
    flex-direction: column;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .request-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-actions {
    width: 100%;
    margin-top: 12px;
  }

  .request-actions button {
    flex: 1;
  }

  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .event-actions {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
