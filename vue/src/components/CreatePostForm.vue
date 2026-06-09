<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '../api/api'; 
// 1. IMPORT USEAUTH TO GET THE LOGGED-IN USER
import { useAuth } from '@/composables/useAuth';

const emit = defineEmits(['post-created']);

// 2. GET THE USER DATA
const { user } = useAuth();

// State for the composition area
const newPostContent = ref('');
const isPosting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const mediaFiles = ref<{ file: File; url: string; type: string }[]>([]);

// Handle media selection
const triggerFileInput = () => {
  fileInput.value?.click();
};

// Handle media selection with limits
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (target.files) {
    const newFiles = Array.from(target.files);

    // 1. Enforce the 5-file maximum limit (matching backend Multer config)
    if (mediaFiles.value.length + newFiles.length > 5) {
      alert("You can only upload a maximum of 5 files per post.");
      if (fileInput.value) fileInput.value.value = ''; // Reset input
      return; 
    }

    newFiles.forEach(file => {
      // 2. Enforce the 50MB file size limit
      const maxSizeInBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        alert(`The file "${file.name}" is too large. Maximum size is 50MB.`);
        return;
      }

      mediaFiles.value.push({
        file,
        url: URL.createObjectURL(file),
        type: file.type.split('/')[0] // 'image' or 'video'
      });
    });
  }
  
  // Reset input to allow selecting the same file again if removed
  if (fileInput.value) fileInput.value.value = '';
};

// Handle submitting a new post
const submitPost = async () => {
    if (!newPostContent.value.trim() && mediaFiles.value.length === 0) return;
    isPosting.value = true;
    
    try {
        const formData = new FormData();
        formData.append('caption', newPostContent.value);
        
        // Append files to formData under the 'media' key
        mediaFiles.value.forEach(media => {
            formData.append('media', media.file); 
        });

        // Ensure headers explicitly define multipart/form-data
        await apiClient.post('/posts/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Reset Form
        newPostContent.value = '';
        mediaFiles.value.forEach(media => URL.revokeObjectURL(media.url));
        mediaFiles.value = [];
        
        emit('post-created');

    } catch (error) {
        console.error('Error creating post:', error);
        alert('Could not post your message. Please try again.');
    } finally {
        isPosting.value = false;
    }
};

const removeMedia = (index: number) => {
  URL.revokeObjectURL(mediaFiles.value[index].url); // Clean up memory
  mediaFiles.value.splice(index, 1);
};

// Clean up Object URLs when component unmounts to prevent memory leaks
onBeforeUnmount(() => {
  mediaFiles.value.forEach(media => URL.revokeObjectURL(media.url));
});
</script>

<template>
  <div class="create-post-card">
    <div class="compose-header">
      
      <div class="author-avatar">
        <img v-if="user?.avatar" :src="`http://localhost:3000${user.avatar}`" alt="My Avatar" class="avatar-img" />
        <span v-else>{{ user?.name?.charAt(0).toUpperCase() || 'U' }}</span>
      </div>

      <textarea 
        v-model="newPostContent" 
        placeholder="What do you want to share?" 
        class="compose-textarea"
        rows="3"
      ></textarea>
    </div>

    <div v-if="mediaFiles.length > 0" class="media-preview-container">
      <div v-for="(media, index) in mediaFiles" :key="index" class="media-preview-item">
        <img v-if="media.type === 'image'" :src="media.url" alt="Preview" />
        <video v-else-if="media.type === 'video'" :src="media.url" controls muted></video>
        <button class="remove-media-btn" @click="removeMedia(index)" aria-label="Remove media">
          <Icon icon="mdi:close" />
        </button>
      </div>
    </div>

    <div class="compose-footer">
      <div class="compose-actions">
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          accept="image/*,video/*" 
          multiple 
          hidden 
        />
        <button class="action-btn upload-btn text-indigo" @click="triggerFileInput">
          <Icon icon="mdi:image-outline" class="action-icon" />
          <span>Photo</span>
        </button>
        <button class="action-btn upload-btn text-pink" @click="triggerFileInput">
          <Icon icon="mdi:video-outline" class="action-icon" />
          <span>Video</span>
        </button>
      </div>
      
      <button 
        class="btn-primary" 
        @click="submitPost" 
        :disabled="isPosting || (!newPostContent.trim() && mediaFiles.length === 0)"
      >
        <Icon v-if="isPosting" icon="mdi:loading" class="spin-icon-small" />
        <span>{{ isPosting ? 'Posting...' : 'Post' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Component Container */
.create-post-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.create-post-card:hover {
  box-shadow: 0 20px 32px rgba(15, 23, 42, 0.06);
}

/* Compose Header */
.compose-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.author-avatar {
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

.compose-avatar {
  background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
}

.compose-textarea {
  flex: 1;
  border: none;
  resize: none;
  font-family: inherit;
  font-size: 1.05rem;
  padding: 0.5rem 0;
  color: #0f172a;
  outline: none;
  background: transparent;
}

.compose-textarea::placeholder {
  color: #94a3b8;
}

/* Media Preview Grid */
.media-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-left: 3.5rem; /* Aligns with the textarea */
}

.media-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.media-preview-item img,
.media-preview-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-media-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(15, 23, 42, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-media-btn:hover {
  background: rgba(15, 23, 42, 0.9);
}

/* Footer & Actions */
.compose-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

.compose-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.action-icon {
  width: 22px;
  height: 22px;
}

.upload-btn.text-indigo { color: #6366f1; }
.upload-btn.text-pink { color: #ec4899; }

/* Primary Button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  border: none;
  background: #6366f1;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon-small {
  font-size: 1.25rem;
  animation: spin 1s linear infinite;
}

@keyframes spin { 
  100% { transform: rotate(360deg); } 
}

/* Mobile adjustments */
@media (max-width: 720px) {
  .create-post-card {
    padding: 1.25rem;
  }
  .media-preview-container {
    padding-left: 0;
  }
}
</style>