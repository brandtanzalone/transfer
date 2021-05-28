

export const state = () => ({
  chats: []
});

export const actions = {
  addChat({commit}, payload){
    commit('ADD_CHAT', payload)
  }
}

export const getters = {
    getChats(state, getters) {
        return state.chats;
    }
}

export const mutations = {
    ADD_CHAT(state, chat) {
        state.chats.push(chat)
    }
}
