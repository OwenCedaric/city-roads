<template>
  <div class="lang-switch-container" :class="[variant, { active: isOpen }]">
    <button 
      type="button" 
      class="lang-toggle-btn"
      @click="toggle"
      :title="tooltipText"
      :aria-label="tooltipText"
    >
      <remix-icon name="global-line" :size="iconSize" class="lang-icon"></remix-icon>
      <span class="lang-current">{{ currentLabel }}</span>
    </button>
  </div>
</template>

<script>
import RemixIcon from './RemixIcon.vue';
import { getLocale, toggleLocale } from '../i18n/index.js';

export default {
  name: 'LanguageSwitch',
  components: {
    RemixIcon
  },
  props: {
    variant: {
      type: String,
      default: 'pill' // 'pill' | 'compact' | 'ghost'
    },
    iconSize: {
      type: Number,
      default: 14
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  computed: {
    currentLocale() {
      return this.$i18n ? this.$i18n.locale : getLocale();
    },
    currentLabel() {
      return this.currentLocale === 'zh' ? '中文' : 'EN';
    },
    tooltipText() {
      return this.currentLocale === 'zh' ? 'Switch to English' : '切换至中文';
    }
  },
  methods: {
    toggle() {
      if (this.$i18n) {
        this.$i18n.toggleLocale();
      } else {
        toggleLocale();
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
@import '../vars.styl';

.lang-switch-container {
  display: inline-flex;
  align-items: center;
  user-select: none;
}

.lang-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: glass-surface;
  backdrop-filter: blur(glass-blur);
  -webkit-backdrop-filter: blur(glass-blur);
  border: 1px solid subtle-border;
  border-radius: 18px;
  padding: 5px 10px;
  font-family: sans-font;
  font-size: 12px;
  font-weight: 500;
  color: primary-ink;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;

  &:hover {
    background: #ffffff;
    border-color: rgba(61, 68, 81, 0.3);
    color: #1a1e24;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }

  .lang-icon {
    color: sole-accent;
    transition: transform 0.3s ease;
  }

  &:hover .lang-icon {
    transform: rotate(20deg);
  }

  .lang-current {
    letter-spacing: 0.02em;
  }
}

.lang-switch-container.compact .lang-toggle-btn {
  padding: 3px 8px;
  font-size: 11px;
}

.lang-switch-container.ghost .lang-toggle-btn {
  background: transparent;
  border-color: transparent;
  box-shadow: none;

  &:hover {
    background: subtle-fill;
  }
}
</style>
