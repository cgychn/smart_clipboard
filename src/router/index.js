import Vue from "vue";
import VueRouter from "vue-router";

import Home from "@/components/Home.vue";
import PasteAssistant from "@/components/PasteAssistant.vue";
import HttpServer from "@/components/HttpServer.vue";
import Downloader from "@/components/Downloader.vue";
import ToolBar from "@/components/ToolBar.vue";
import DownloadProgress from "@/components/DownloadProgress.vue";

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
        },
        {
            path: "/downloader",
            name: "downloader",
            component: Downloader
        },
        {
            path: "/toolBar",
            name: "toolBar",
            component: ToolBar
        },
        {
            path: "/downloadProgress",
            name: "downloadProgress",
            component: DownloadProgress
        }
    ]
})
export default router