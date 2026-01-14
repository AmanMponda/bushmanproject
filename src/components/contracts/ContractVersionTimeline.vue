<template>
  <div class="version-timeline">
    <!-- Timeline Header -->
    <div class="timeline-header">
      <h5>Version History</h5>
      <span v-if="versions && versions.length > 0" class="version-count">
        {{ versions.length }} version{{ versions.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Timeline Items -->
    <div class="timeline-items">
      <div
        v-for="(version, index) in sortedVersions"
        :key="version.id || index"
        :class="['timeline-item', `status-${version.status.toLowerCase()}`]"
      >
        <!-- Marker -->
        <div class="timeline-marker">
          <i :class="getStatusIcon(version.status)"></i>
        </div>

        <!-- Content -->
        <div class="timeline-content">
          <div class="header-row">
            <div class="version-number">
              <span class="label">Version</span>
              <span class="number">{{ version.version_number }}</span>
            </div>
            <div class="status-and-date">
              <span :class="['status-badge', `badge-${version.status.toLowerCase()}`]">
                {{ formatStatus(version.status) }}
              </span>
              <span class="created-date">{{ formatDate(version.created_at) }}</span>
            </div>
          </div>

          <!-- Created By -->
          <div class="meta-info">
            <span class="meta-item">
              <i class="fas fa-user"></i>
              {{ version.created_by || 'System' }}
            </span>
            <span v-if="version.approved_at" class="meta-item approved">
              <i class="fas fa-check-circle"></i>
              Approved by {{ version.approved_by || 'System' }}
            </span>
            <span v-if="version.signed_at" class="meta-item signed">
              <i class="fas fa-pen-fancy"></i>
              Signed by {{ version.signed_by || 'System' }}
            </span>
          </div>

          <!-- Summary -->
          <p v-if="version.changes_summary" class="summary">
            {{ version.changes_summary }}
          </p>

          <!-- Actions -->
          <div class="actions">
            <button v-if="!version.file_url" class="btn-link" @click.prevent>
              <i class="fas fa-file-pdf"></i> View PDF
            </button>
            <a v-else :href="version.file_url" target="_blank" class="btn-link">
              <i class="fas fa-file-pdf"></i> Download PDF
            </a>
            <button
              v-if="version.status === 'APPROVED' && !version.signed_at"
              class="btn-link sign"
              @click="$emit('sign-version', version)"
            >
              <i class="fas fa-pen-fancy"></i> Sign Version
            </button>
            <button class="btn-link compare" @click="$emit('compare-version', version)">
              <i class="fas fa-exchange-alt"></i> Compare
            </button>
          </div>

          <!-- Rejection Note -->
          <div v-if="version.status === 'REJECTED'" class="rejection-note">
            <i class="fas fa-times-circle"></i>
            <strong>Rejected:</strong> {{ version.rejection_reason || 'No reason provided' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!versions || versions.length === 0" class="empty-state">
      <i class="fas fa-file-alt"></i>
      <p>No versions available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ContractVersion {
  id?: string | number
  version_number: number
  status: string
  created_by?: string
  created_at?: string
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
  changes_summary?: string
  file_url?: string
  signed_at?: string | null
  signed_by?: string | null
}

interface Props {
  versions?: ContractVersion[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'sign-version': [version: ContractVersion]
  'compare-version': [version: ContractVersion]
}>()

// Sorted versions by version number (descending - newest first)
const sortedVersions = computed(() => {
  return props.versions ? [...props.versions].sort((a, b) => b.version_number - a.version_number) : []
})

// Methods
const formatDate = (date: string | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ')
}

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    DRAFT: 'fas fa-file-alt',
    PENDING_REVIEW: 'fas fa-hourglass-half',
    APPROVED: 'fas fa-check-circle',
    REJECTED: 'fas fa-times-circle',
    SIGNED: 'fas fa-file-contract'
  }
  return iconMap[status] || 'fas fa-file'
}
</script>

<style scoped lang="scss">
.version-timeline {
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  .timeline-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;

    h5 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .version-count {
      background: #e9ecef;
      color: #495057;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .timeline-items {
    position: relative;
    padding: 0;

    .timeline-item {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 6px;
      background: #f9f9f9;
      border-left: 4px solid #e9ecef;
      transition: all 0.3s ease;

      &:hover {
        background: #f5f5f5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      &.status-draft {
        border-left-color: #adb5bd;
        background: #f8f9fa;
      }

      &.status-pending_review {
        border-left-color: #ffc107;
        background: #fffbf0;
      }

      &.status-approved {
        border-left-color: #10b981;
        background: #f0fdf4;
      }

      &.status-rejected {
        border-left-color: #dc3545;
        background: #fff5f5;
      }

      &.status-signed {
        border-left-color: #0066cc;
        background: #f0f4ff;
      }

      .timeline-marker {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: white;
        border: 2px solid #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        margin-top: 0;

        i {
          color: #666;
        }
      }

      &.status-draft .timeline-marker {
        background: #f0f0f0;
        border-color: #999;
        i {
          color: #666;
        }
      }

      &.status-pending_review .timeline-marker {
        background: #fff9e6;
        border-color: #ffc107;
        i {
          color: #ffc107;
        }
      }

      &.status-approved .timeline-marker {
        background: #e6f7ed;
        border-color: #10b981;
        i {
          color: #10b981;
        }
      }

      &.status-rejected .timeline-marker {
        background: #ffe0e0;
        border-color: #dc3545;
        i {
          color: #dc3545;
        }
      }

      &.status-signed .timeline-marker {
        background: #e0ecff;
        border-color: #0066cc;
        i {
          color: #0066cc;
        }
      }

      .timeline-content {
        flex: 1;
        min-width: 0;

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          gap: 10px;

          .version-number {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              font-size: 12px;
              color: #666;
              font-weight: 600;
            }

            .number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #e9ecef;
              color: #333;
              font-weight: 700;
              font-size: 14px;
            }
          }

          .status-and-date {
            display: flex;
            gap: 10px;
            align-items: center;

            .status-badge {
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;

              &.badge-draft {
                background: #e9ecef;
                color: #495057;
              }

              &.badge-pending_review {
                background: #fff3cd;
                color: #856404;
              }

              &.badge-approved {
                background: #d4edda;
                color: #155724;
              }

              &.badge-rejected {
                background: #f8d7da;
                color: #721c24;
              }

              &.badge-signed {
                background: #d1ecf1;
                color: #0c5460;
              }
            }

            .created-date {
              font-size: 12px;
              color: #666;
              white-space: nowrap;
            }
          }
        }

        .meta-info {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 8px;
          font-size: 12px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #495057;

            i {
              font-size: 11px;
              opacity: 0.7;
            }

            &.approved {
              color: #10b981;
              font-weight: 600;
            }

            &.signed {
              color: #0066cc;
              font-weight: 600;
            }
          }
        }

        .summary {
          margin: 8px 0;
          padding: 8px 10px;
          background: #f5f5f5;
          border-left: 3px solid #0066cc;
          border-radius: 3px;
          font-size: 13px;
          color: #333;
          line-height: 1.4;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;

          .btn-link {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            background: none;
            border: 1px solid #0066cc;
            color: #0066cc;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: #0066cc;
              color: white;
            }

            i {
              font-size: 10px;
            }

            &.sign {
              border-color: #10b981;
              color: #10b981;

              &:hover {
                background: #10b981;
                color: white;
              }
            }

            &.compare {
              border-color: #ffc107;
              color: #ffc107;

              &:hover {
                background: #ffc107;
                color: white;
              }
            }
          }
        }

        .rejection-note {
          margin-top: 10px;
          padding: 10px;
          background: #fff5f5;
          border: 1px solid #f8d7da;
          border-radius: 4px;
          color: #721c24;
          font-size: 12px;
          display: flex;
          gap: 8px;

          i {
            flex-shrink: 0;
            color: #dc3545;
          }

          strong {
            font-weight: 600;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;

    i {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.5;
    }

    p {
      margin: 10px 0 0 0;
      font-size: 14px;
    }
  }
}
</style>
