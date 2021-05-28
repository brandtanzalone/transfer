import uuid from '~/common/uuid'

export function createFrame(doc, sent, text, name, predStart, predEnd) {
  return {
    id: uuid(),
    doc: doc,
    sent: sent,
    text: text,
    predicate : {
      start: predStart,
      end: predEnd,
      label: name
    },
    args: []
  }
}

export function createArg(name, start, end) {
  return {
    id: uuid(),
    start: start,
    end: end,
    label: name
  }
}
