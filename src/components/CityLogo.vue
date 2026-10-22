<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    :width="size"
    :height="size"
    class="city-logo"
  >
    <!-- Street Grid Network (Freeform Open Cartography) -->
    <path d="M 28 20 C 38 42, 54 58, 64 64 C 74 70, 94 92, 102 108" class="logo-road-major"/>
    <path d="M 20 88 C 40 82, 54 74, 64 64 C 76 52, 92 36, 110 32" class="logo-road-major"/>
    <path d="M 64 10 L 64 118" class="logo-road-major"/>
    <path d="M 12 50 C 32 50, 50 48, 64 42 C 80 34, 100 24, 116 20" class="logo-road-minor"/>
    <path d="M 14 74 C 36 76, 52 82, 64 88 C 82 96, 98 106, 112 112" class="logo-road-minor"/>
    <path d="M 40 18 L 40 110" class="logo-road-minor"/>
    <path d="M 88 18 L 88 110" class="logo-road-minor"/>
    <path d="M 26 36 L 52 36" class="logo-road-fine"/>
    <path d="M 76 36 L 102 36" class="logo-road-fine"/>
    <path d="M 24 100 L 50 100" class="logo-road-fine"/>
    <path d="M 78 92 L 104 92" class="logo-road-fine"/>
    <path d="M 52 56 L 52 74" class="logo-road-fine"/>
    <path d="M 76 54 L 76 72" class="logo-road-fine"/>
    <!-- Central Crossroads Node in Chronicle Sole Accent -->
    <circle cx="64" cy="64" r="7.5" class="logo-node-ring"/>
    <circle cx="64" cy="64" r="4.5" class="logo-node"/>
    <circle cx="40" cy="84" r="2.5" class="logo-node" opacity="0.85"/>
    <circle cx="88" cy="46" r="2.5" class="logo-node" opacity="0.85"/>
  </svg>
</template>

<script>
export default {
  name: 'CityLogo',
  props: {
    size: {
      type: [Number, String],
      default: 48
    }
  }
}
</script>

<style lang="stylus" scoped>
@import('../vars.styl');

.city-logo {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.06);
  }
}

.logo-road-major {
  stroke: primary-ink;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  opacity: 0.85;
}

.logo-road-minor {
  stroke: primary-ink;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  opacity: 0.5;
}

.logo-road-fine {
  stroke: primary-ink;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  opacity: 0.3;
}

.logo-node-ring {
  stroke: sole-accent;
  stroke-width: 1.5;
  fill: none;
  opacity: 0.7;
}

.logo-node {
  fill: sole-accent;
}
</style>
