<template>
  <div v-if="modelValue" class="ai-modal-backdrop" @click="closeOnBackdrop">
    <div class="ai-modal-dialog shadow" @click.stop>
      <!-- Modal Header -->
      <div class="ai-modal-header">
        <div class="ai-header-title-group">
          <div class="ai-badge">AGENT SKILL</div>
          <h2 class="ai-modal-title">{{ $t('aiModal.title') }}</h2>
        </div>
        <button type="button" class="ai-close-btn" @click="close" title="Close (Esc)">
          <remix-icon name="close-line" :size="18"></remix-icon>
        </button>
      </div>

      <!-- Current City Callout (if active) -->
      <div v-if="cityName" class="ai-city-callout">
        <remix-icon name="map-pin-2-line" :size="15" class="callout-icon"></remix-icon>
        <div class="callout-body">
          <span class="callout-label">{{ $t('aiModal.cityPromptLabel') }}</span>
          <code class="callout-code">{{ cityExclusivePrompt }}</code>
        </div>
        <button class="ai-copy-btn mini" @click="copyText(cityExclusivePrompt, 'cityPrompt')">
          <template v-if="copiedKey === 'cityPrompt'">
            <remix-icon name="check-line" :size="12"></remix-icon>
            <span>{{ $t('common.copied') }}</span>
          </template>
          <template v-else>
            <remix-icon name="file-copy-line" :size="12"></remix-icon>
            <span>{{ $t('common.copy') }}</span>
          </template>
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="ai-modal-tabs">
        <button 
          type="button" 
          class="ai-tab-btn" 
          :class="{ active: activeTab === 'prompt' }" 
          @click="activeTab = 'prompt'"
        >
          <remix-icon name="chat-smile-2-line" :size="14"></remix-icon>
          <span>{{ $t('aiModal.tabPrompt') }}</span>
        </button>
        <button 
          type="button" 
          class="ai-tab-btn" 
          :class="{ active: activeTab === 'cli' }" 
          @click="activeTab = 'cli'"
        >
          <remix-icon name="terminal-box-line" :size="14"></remix-icon>
          <span>{{ $t('aiModal.tabCli') }}</span>
        </button>
        <button 
          type="button" 
          class="ai-tab-btn" 
          :class="{ active: activeTab === 'themes' }" 
          @click="activeTab = 'themes'"
        >
          <remix-icon name="palette-line" :size="14"></remix-icon>
          <span>{{ $t('aiModal.tabThemes') }}</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="ai-modal-body">
        <!-- 1. Prompt Tab -->
        <div v-if="activeTab === 'prompt'" class="tab-pane">
          <p class="tab-desc">
            {{ $t('aiModal.promptIntro') }}
          </p>

          <div class="prompt-cards-grid">
            <div v-for="(item, idx) in promptExamples" :key="idx" class="prompt-card">
              <div class="prompt-card-header">
                <span class="prompt-intent-tag">{{ item.tag }}</span>
                <button class="ai-copy-btn" @click="copyText(item.prompt, 'prompt_' + idx)">
                  <template v-if="copiedKey === 'prompt_' + idx">
                    <remix-icon name="check-line" :size="12"></remix-icon>
                    <span>{{ $t('common.copied') }}</span>
                  </template>
                  <template v-else>
                    <remix-icon name="file-copy-line" :size="12"></remix-icon>
                    <span>{{ $t('aiModal.copyPrompt') }}</span>
                  </template>
                </button>
              </div>
              <div class="prompt-text">“{{ item.prompt }}”</div>
              <div class="prompt-meta">{{ item.desc }}</div>
            </div>
          </div>

          <div class="tip-box">
            <remix-icon name="lightbulb-line" :size="16" class="tip-icon"></remix-icon>
            <div class="tip-text">
              <strong>{{ $t('aiModal.promptTipsTitle') }}</strong> {{ $t('aiModal.promptTipsContent') }}
            </div>
          </div>
        </div>

        <!-- 2. CLI Tab -->
        <div v-if="activeTab === 'cli'" class="tab-pane">
          <p class="tab-desc">
            {{ $t('aiModal.cliIntro') }}
          </p>

          <div class="cli-command-block">
            <div class="cli-label">{{ $t('aiModal.cliLabelBasic') }}</div>
            <div class="code-row">
              <code>npm run export:city -- --city "{{ cityName || 'Paris' }}"</code>
              <button class="ai-copy-btn" @click="copyText(`npm run export:city -- --city &quot;${cityName || 'Paris'}&quot;`, 'cli_simple')">
                <template v-if="copiedKey === 'cli_simple'">
                  <remix-icon name="check-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copied') }}</span>
                </template>
                <template v-else>
                  <remix-icon name="file-copy-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copy') }}</span>
                </template>
              </button>
            </div>
          </div>

          <div class="cli-command-block">
            <div class="cli-label">{{ $t('aiModal.cliLabelMidnight') }}</div>
            <div class="code-row">
              <code>npm run export:city -- --city "Kyoto" --theme midnight --out ./output/kyoto-gold.svg</code>
              <button class="ai-copy-btn" @click="copyText('npm run export:city -- --city &quot;Kyoto&quot; --theme midnight --out ./output/kyoto-gold.svg', 'cli_gold')">
                <template v-if="copiedKey === 'cli_gold'">
                  <remix-icon name="check-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copied') }}</span>
                </template>
                <template v-else>
                  <remix-icon name="file-copy-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copy') }}</span>
                </template>
              </button>
            </div>
          </div>

          <div class="cli-command-block">
            <div class="cli-label">{{ $t('aiModal.cliLabelWallpaper') }}</div>
            <div class="code-row">
              <code>npm run export:city -- --city "Tokyo" --theme blueprint --width 1080 --height 1920 --no-label</code>
              <button class="ai-copy-btn" @click="copyText('npm run export:city -- --city &quot;Tokyo&quot; --theme blueprint --width 1080 --height 1920 --no-label', 'cli_wallpaper')">
                <template v-if="copiedKey === 'cli_wallpaper'">
                  <remix-icon name="check-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copied') }}</span>
                </template>
                <template v-else>
                  <remix-icon name="file-copy-line" :size="12"></remix-icon>
                  <span>{{ $t('common.copy') }}</span>
                </template>
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Themes Tab -->
        <div v-if="activeTab === 'themes'" class="tab-pane">
          <p class="tab-desc">{{ $t('aiModal.themesIntro') }}</p>

          <div class="theme-palette-grid">
            <div v-for="t in themes" :key="t.key" class="theme-card" :style="{ backgroundColor: t.bg }">
              <div class="theme-card-line" :style="{ backgroundColor: t.line }"></div>
              <div class="theme-card-line short" :style="{ backgroundColor: t.line }"></div>
              <div class="theme-card-info">
                <span class="theme-card-name" :style="{ color: t.text }">{{ t.label }}</span>
                <code class="theme-card-key" :style="{ color: t.accent }">--theme {{ t.key }}</code>
              </div>
            </div>
          </div>

          <h4 class="sub-heading">{{ $t('aiModal.subHeadingParams') }}</h4>
          <div class="params-table-wrapper">
            <table class="params-table">
              <thead>
                <tr>
                  <th>{{ $t('aiModal.thParam') }}</th>
                  <th>{{ $t('aiModal.thType') }}</th>
                  <th>{{ $t('aiModal.thDefault') }}</th>
                  <th>{{ $t('aiModal.thDesc') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>-c, --city</code></td>
                  <td>String</td>
                  <td><em>{{ $t('aiModal.required') }}</em></td>
                  <td>{{ $t('aiModal.paramCityDesc') }}</td>
                </tr>
                <tr>
                  <td><code>-t, --theme</code></td>
                  <td>String</td>
                  <td><code>dark</code></td>
                  <td>{{ $t('aiModal.paramThemeDesc') }}</td>
                </tr>
                <tr>
                  <td><code>-w, --width</code></td>
                  <td>Number</td>
                  <td><code>1200</code></td>
                  <td>{{ $t('aiModal.paramWidthDesc') }}</td>
                </tr>
                <tr>
                  <td><code>-h, --height</code></td>
                  <td>Number</td>
                  <td><code>1600</code></td>
                  <td>{{ $t('aiModal.paramHeightDesc') }}</td>
                </tr>
                <tr>
                  <td><code>--filter</code></td>
                  <td>String</td>
                  <td><code>all</code></td>
                  <td>{{ $t('aiModal.paramRoadsDesc') }}</td>
                </tr>
                <tr>
                  <td><code>--no-label</code></td>
                  <td>Boolean</td>
                  <td><code>false</code></td>
                  <td>{{ $t('aiModal.paramNoTextDesc') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="ai-modal-footer">
        <div class="footer-tip">
          {{ $t('aiModal.outputNote') }}
        </div>
        <button type="button" class="ai-primary-btn" @click="close">{{ $t('aiModal.closeBtn') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import RemixIcon from './RemixIcon.vue';

export default {
  name: 'AiSkillModal',
  components: {
    RemixIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    cityName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      activeTab: 'prompt',
      copiedKey: null,
      copyTimeout: null
    };
  },
  computed: {
    cityExclusivePrompt() {
      return this.$t('aiModal.cityPromptTemplate', { cityName: this.cityName || 'Paris' });
    },
    promptExamples() {
      return this.$t('aiModal.prompts') || [];
    },
    themes() {
      const labels = this.$t('aiModal.themeLabels') || {};
      const base = [
        { key: 'dark', bg: '#0d1117', line: 'rgba(240, 246, 252, 0.85)', text: '#f0f6fc', accent: '#58a6ff' },
        { key: 'light', bg: '#fbf9f6', line: 'rgba(44, 52, 55, 0.82)', text: '#1a202c', accent: '#3182ce' },
        { key: 'blueprint', bg: '#0b2545', line: 'rgba(138, 201, 255, 0.85)', text: '#ffffff', accent: '#64b5f6' },
        { key: 'midnight', bg: '#06080e', line: 'rgba(255, 215, 0, 0.85)', text: '#ffd700', accent: '#ffa000' },
        { key: 'emerald', bg: '#0a1914', line: 'rgba(74, 222, 128, 0.85)', text: '#86efac', accent: '#4ade80' },
        { key: 'warm-sand', bg: '#f4ece1', line: 'rgba(74, 59, 50, 0.85)', text: '#382c24', accent: '#8c6d58' }
      ];
      return base.map(b => ({
        ...b,
        label: labels[b.key] || b.key
      }));
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    closeOnBackdrop(e) {
      if (e.target === e.currentTarget) {
        this.close();
      }
    },
    copyText(text, key) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.copiedKey = key;
      if (this.copyTimeout) clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.copiedKey = null;
      }, 2000);
    }
  }
};
</script>

<style lang="stylus" scoped>
@import('../vars.styl');

.ai-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(18, 22, 28, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: aiFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.ai-modal-dialog {
  background: base-surface;
  border: 1px solid subtle-border;
  border-radius: 8px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: aiSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.ai-modal-header {
  padding: 18px 24px 14px 24px;
  border-bottom: 1px solid subtle-border;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: glass-surface;

  .ai-header-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ai-badge {
    display: inline-block;
    align-self: flex-start;
    padding: 2px 8px;
    background: subtle-fill;
    border: 1px solid subtle-border;
    border-radius: 12px;
    font-family: sans-font;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: sole-accent;
  }

  .ai-modal-title {
    margin: 0;
    font-family: serif-font;
    font-size: 20px;
    font-weight: 600;
    color: primary-ink;
    letter-spacing: 0.02em;
  }

  .ai-close-btn {
    border: none;
    background: transparent;
    padding: 6px;
    border-radius: 50%;
    cursor: pointer;
    color: secondary-ink;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease-in-out, color 0.15s ease-in-out;

    &:hover {
      background: subtle-fill;
      color: primary-ink;
    }
  }
}

.ai-city-callout {
  margin: 12px 24px 0 24px;
  padding: 10px 14px;
  background: rgba(130, 161, 185, 0.1);
  border: 1px solid rgba(130, 161, 185, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;

  .callout-icon {
    color: sole-accent;
    flex-shrink: 0;
  }

  .callout-body {
    flex: 1;
    min-width: 0;
    font-family: sans-font;
    font-size: 12px;
    color: primary-ink;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;

    .callout-label {
      font-weight: 500;
      color: sole-accent;
    }

    .callout-code {
      background: rgba(255, 255, 255, 0.7);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      color: primary-ink;
    }
  }
}

.ai-modal-tabs {
  padding: 12px 24px 0 24px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid subtle-border;
  background: base-surface;

  .ai-tab-btn {
    padding: 8px 16px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    font-family: sans-font;
    font-size: 13px;
    font-weight: 500;
    color: secondary-ink;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s ease-in-out, border-color 0.15s ease-in-out;

    &:hover {
      color: primary-ink;
    }

    &.active {
      color: sole-accent;
      border-bottom-color: sole-accent;
      font-weight: 600;
    }
  }
}

.ai-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;

  .tab-desc {
    font-family: sans-font;
    font-size: 13px;
    color: secondary-ink;
    line-height: 1.6;
    margin: 0 0 16px 0;

    code {
      background: subtle-fill;
      padding: 2px 5px;
      border-radius: 3px;
      color: primary-ink;
      font-size: 12px;
    }
  }
}

.prompt-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  .prompt-card {
    background: rgba(61, 68, 81, 0.03);
    border: 1px solid subtle-border;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
      background: rgba(61, 68, 81, 0.05);
      border-color: sole-accent;
    }

    .prompt-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .prompt-intent-tag {
      font-family: sans-font;
      font-size: 11px;
      font-weight: 600;
      color: sole-accent;
      letter-spacing: 0.04em;
    }

    .prompt-text {
      font-family: sans-font;
      font-size: 13px;
      font-weight: 500;
      color: primary-ink;
      line-height: 1.45;
    }

    .prompt-meta {
      font-family: sans-font;
      font-size: 11px;
      color: secondary-ink;
      line-height: 1.4;
    }
  }
}

.tip-box {
  background: rgba(130, 161, 185, 0.08);
  border: 1px solid subtle-border;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;

  .tip-icon {
    color: sole-accent;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .tip-text {
    font-family: sans-font;
    font-size: 12px;
    color: primary-ink;
    line-height: 1.5;
  }
}

.cli-command-block {
  margin-bottom: 14px;

  .cli-label {
    font-family: sans-font;
    font-size: 12px;
    font-weight: 500;
    color: primary-ink;
    margin-bottom: 6px;
  }

  .code-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1c1f26;
    border-radius: 5px;
    padding: 8px 12px;
    gap: 12px;

    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      color: #9cb4cd;
      overflow-x: auto;
      white-space: nowrap;
    }
  }
}

.theme-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 20px;

  .theme-card {
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

    .theme-card-line {
      height: 3px;
      border-radius: 2px;
      width: 100%;

      &.short {
        width: 60%;
      }
    }

    .theme-card-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }

    .theme-card-name {
      font-family: sans-font;
      font-size: 12px;
      font-weight: 600;
    }

    .theme-card-key {
      font-family: monospace;
      font-size: 11px;
    }
  }
}

.sub-heading {
  font-family: serif-font;
  font-size: 14px;
  font-weight: 600;
  color: primary-ink;
  margin: 16px 0 8px 0;
  letter-spacing: 0.04em;
}

.params-table-wrapper {
  overflow-x: auto;
  border: 1px solid subtle-border;
  border-radius: 6px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  font-family: sans-font;
  font-size: 12px;

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid subtle-border;
  }

  th {
    background: subtle-fill;
    font-weight: 600;
    color: primary-ink;
  }

  td {
    color: secondary-ink;

    code {
      background: subtle-fill;
      padding: 1px 4px;
      border-radius: 3px;
      color: primary-ink;
      font-size: 11px;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.ai-copy-btn {
  border: 1px solid subtle-border;
  background: white;
  color: primary-ink;
  border-radius: 4px;
  padding: 4px 10px;
  font-family: sans-font;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease-in-out;

  &:hover {
    border-color: sole-accent;
    color: sole-accent;
    background: subtle-fill;
  }

  &.mini {
    padding: 3px 8px;
    font-size: 11px;
  }
}

.ai-modal-footer {
  padding: 14px 24px;
  border-top: 1px solid subtle-border;
  background: glass-surface;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .footer-tip {
    font-family: sans-font;
    font-size: 11px;
    color: secondary-ink;
    line-height: 1.4;

    code {
      background: subtle-fill;
      padding: 1px 4px;
      border-radius: 3px;
      color: primary-ink;
    }
  }

  .ai-primary-btn {
    padding: 7px 18px;
    background: sole-accent;
    border: none;
    border-radius: 4px;
    color: white;
    font-family: sans-font;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s ease-in-out;

    &:hover {
      opacity: 0.9;
    }
  }
}

@keyframes aiFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes aiSlideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: small-screen) {
  .ai-modal-dialog {
    max-height: 94vh;
  }

  .ai-modal-header {
    padding: 14px 16px;

    .ai-modal-title {
      font-size: 17px;
    }
  }

  .ai-city-callout {
    margin: 10px 16px 0 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .ai-modal-tabs {
    padding: 8px 16px 0 16px;
    overflow-x: auto;
  }

  .ai-modal-body {
    padding: 16px;
  }

  .prompt-cards-grid {
    grid-template-columns: 1fr;
  }

  .theme-palette-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ai-modal-footer {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;

    .footer-tip {
      text-align: center;
    }

    .ai-primary-btn {
      width: 100%;
    }
  }
}
</style>
