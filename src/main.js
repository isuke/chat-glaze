//
// Styles
//
import "destyle.css";
import "./styles/_bases.scss";

//
// Scripts
//
import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

new Vue({
  render: function(h) {
    return h(App);
  }
}).$mount("#app");
