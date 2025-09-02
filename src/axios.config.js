import Vue from 'vue'
import router from './router'
import Vuex from 'vuex'
import axios from 'axios'

import {Message, MessageBox, Loading} from 'element-ui'


Vue.prototype.ajax = axios;
Vuex.Store.prototype.ajax = axios;
Vuex.Store.prototype.router = router;

// store this.Message & this.MessageBox
Vuex.Store.prototype.Message = Message;
Vuex.Store.prototype.MessageBox = MessageBox;
Vuex.Store.prototype.Loading = Loading;
