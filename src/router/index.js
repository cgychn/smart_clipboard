import Vue from "vue";
import VueRouter from "vue-router";

import Home from "@/components/Home.vue";
import PasteAssistant from "@/components/PasteAssistant.vue";
import HttpServer from "@/components/HttpServer.vue";

Vue.use(VueRouter)

const router = new VueRouter({
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/pasteAssistant',
            name: 'pasteAssistant',
            component: PasteAssistant
        },
        {
            path: "/httpServer",
            name: "httpServer",
            component: HttpServer
        }
    ]
})
export default router