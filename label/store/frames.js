import {ipcRenderer} from 'electron'
import Vue from 'vue'

export const state = () => ({
  frames: {},
  loaded: false,
  clean: true
})

export const actions = {
  activate({ commit }) {
    ipcRenderer.invoke('ipcFrames').then((frames) => {
      commit('SET_FRAMES', frames)
      commit('SET_LOADED')
    })
  },
  remove_frame({commit, dispatch, state}, {id}) {
    const doc = state.frames[id].doc
    commit('REMOVE_FRAME', {'id': id})
    dispatch('write_frames', {doc: doc})
  },
  remove_arg({commit, state, dispatch}, payload) {
    commit('REMOVE_ARG', payload)
    dispatch('write_frames', {doc: state.frames[payload.frame].doc})
  },
  add_frame({commit, dispatch}, frame) {
    commit('ADD_FRAME', frame)
    dispatch('write_frames', {doc: frame.doc})
  },
  add_arg({commit, dispatch, state}, payload) {
    commit('ADD_ARG', payload)
    dispatch('write_frames', {doc: state.frames[payload.id].doc})
  },
  update_arg({ commit, dispatch }, payload) {
    commit('UPDATE_ARG', payload)
    dispatch('write_frames', {doc: state.frames[payload.frame].doc})
  },
  write_frames({ state, commit }, { doc }) {
    commit("DIRTY")
    ipcRenderer.invoke("ipcWriteFrames", {
      doc: doc,
      frames: Object.values(state.frames).filter((f) => f.doc === doc)
    }).then(() => {
      commit("CLEAN")
    })
  }
}

export const getters = {
  all(state) {
    return state.frames
  },
  fetch: (state)=> (id) => {
    return state.frames[id]
  },
  counts(state) {
    const count = {}
    Object.values(state.frames).forEach((f) => {
      if(!(f.predicate.label in count)) {
        count[f.predicate.label]  = 0
      }
      count[f.predicate.label] += 1
    })
    return count
  },
  filter: (state)=> (filters) => {
    if('frame' in filters && filters['frame']) {
      return [state.frames[filters['frame']]]
    } else if('doc' in filters && filters['doc']) {
      return Object.values(state.frames).filter((f) => {
        return f.doc === filters['doc']
      })
    } else if('frameType' in filters && filters['frameType']) {
      return Object.entries(state.frames).filter((kv) => {
        return kv[1].predicate.label === filters['frameType']
      })
    }
    return Object.values(state.frames)
  }
}

export const mutations = {
  SET_FRAMES(state, frames) {
    state.frames = frames
  },
  ADD_FRAME(state, frame) {
    Vue.set(state.frames, frame.id, frame)
  },
  REMOVE_FRAME(state, {id}) {
    Vue.delete(state.frames, id)
  },
  REMOVE_ARG(state, {frame, id}) {
    const f = state.frames[frame]
    f.args = f.args.filter((a) => a.id !== id)
  },
  ADD_ARG(state, {id, arg}) {
    state.frames[id].args.push(arg)
  },
  UPDATE_ARG(state, {frame, id, label}) {
    state.frames[frame].args.find((a) => a.id === id).label = label
  },
  UPDATE_FRAME(state, frame) {
    Vue.set(state.frames, frame.id, frame)
  },
  SET_LOADED(state) {
    state.loaded = true
  },
  CLEAN(state) {
    state.clean = true
  },
  DIRTY(state) {
    state.clean = false
  }

}
