<template>
    <div class="icon" :style="iconStyle">
      <svg 
        t="1749548645803" 
        class="icon" 
        viewBox="0 0 1024 1024" 
        version="1.1" 
        xmlns="http://www.w3.org/2000/svg" 
        p-id="4366" 
        width="100%"
        height="100%"
        v-if="type === 'net'"
      >
        <path d="M819.2 921.6C819.2 548.113067 496.605867 204.8 136.533333 204.8V102.4c420.864 0 785.066667 383.1808 785.066667 819.2h-102.4zM283.511467 827.767467a94.481067 94.481067 0 0 1-45.2608 81.237333 87.825067 87.825067 0 0 1-90.555734 0A94.481067 94.481067 0 0 1 102.4 827.767467 92.16 92.16 0 0 1 192.955733 733.866667a92.16 92.16 0 0 1 90.555734 93.9008zM136.533333 409.6a520.772267 520.772267 0 0 1 512 512h-102.4A425.3696 425.3696 0 0 0 136.533333 512v-102.4z" 
            :fill="color"
            p-id="4367"
        >
        </path>
      </svg>
    </div>
  </template>
  
  <script>
  export default {
    name: "Icon",
    props: {
      "iconStyle": {
        type: String,
        default: ''
      },
      "color": {
        type: String,
        default: '#4290f7'
      },
      "type": {
  
      }
    },
  }
  </script>
  
  <style lang="scss">
  .icon {
    display: inline-block;
  }
  .loading {
    -webkit-transform: rotate(90deg);
    animation: rotation 2s linear infinite;
  }
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  