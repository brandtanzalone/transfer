<template>
  <div @click="open" @touchend="open" class="highlight-container highlight-container--bottom-labels">
    <span v-for="(chunk, i) in chunks">
      <span :style="{ borderColor: chunk.color ? chunk.color : 'unset', fontSize: fontSize + 'px' }"
            :class="{ highlight: chunk.label, bottom: chunk.label }">
        <span :class="{highlight__content: chunk.label, predicate: chunk.pred}">{{ chunk.text }}<v-icon
          v-if="chunk.label" @click.stop="removeArg(chunk.id)"
          class="delete">mdi-close-circle</v-icon></span><span
        :data-label="chunk.label" :style="{ backgroundColor: chunk.color, color: chunk.textColor }"
        class="highlight__label"/>
      </span>
  </span>
    <v-menu
      v-model="showMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
    >
      <v-list
        dense
        min-width="150"
        max-height="400"
        class="overflow-y-auto"
      >
        <v-list-item
          v-for="(label, i) in labels"
          :key="i"
          v-shortkey="[label.suffix_key]"
          @shortkey="assignLabel(label.text)"
          @click="assignLabel(label.text)"
        >
          <v-list-item-content>
            <v-list-item-title v-text="label.text"/>
          </v-list-item-content>
          <v-list-item-action>
            <v-list-item-action-text v-text="label.description"/>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>

  import {createArg} from "../common/frames";


  export default {
    components: {},
    props: {
      frame: {
        type: Object,
        required: true
      },
      fontSize: {
        type: Number,
        default: 16
      }
    },
    data() {
      return {
        showMenu: false,
        x: 0,
        y: 0,
        start: 0,
        end: 0
      }
    },
    computed: {
      labels() {
        if(!this.validateSpan()) {
          return []
        }
        return this.generateLabel(this.frame.predicate.label)
      },
      sortedArguments() {
        return this.frame.args.slice().sort((a, b) => a.start - b.start)
      },
      chunks: function () {
        let chunks = []
        let args = this.sortedArguments

        // add trigger
        const pred = {
          start: this.frame.predicate.start,
          end: this.frame.predicate.end,
          pred: true
        }
        let foundPred = false
        for (const arg of args) {
          if (arg.start === pred.start && arg.end === pred.end) {
            arg.pred = true
            foundPred = true
            break
          }
        }

        if(!foundPred) {
          args.push(pred)
          args = args.sort((a, b) => a.start - b.start)
        }

        let startOffset = 0
        for (const arg of args) {
          chunks = chunks.concat(this.makeChunks(this.frame.text.slice(startOffset, arg.start)))
          chunks.push({
            pred: arg.pred,
            id: arg.id,
            label: arg.label? arg.label: null,
            color: '#e6d176',
            showMenu: false,
            text_color: '#00000',
            text: this.frame.text.slice(arg.start, arg.end)
          })
          startOffset = arg.end
        }
        chunks = chunks.concat(this.makeChunks(this.frame.text.slice(startOffset, this.frame.text.length)))
        return chunks
      }
    },
    methods: {
      removeArg(id) {
        this.$store.dispatch('frames/remove_arg', {
          frame: this.frame.id,
          id: id
        })
      },
      addArg(start, end, label, frameId) {
        this.$store.dispatch('frames/add_arg', {
          id: this.frame.id,
          arg: createArg(label, start, end)
        })
      },
      updateArg(label, existing, frameId) {
        this.$store.dispatch('frames/update_arg', {
          frame: frameId,
          id: existing,
          label: label
        })
      },
      generateLabel(predicate) {
        const args = this.$store.getters['propbank/getArgsByPredicate'](predicate)

        function toLabel(value, descr) {
          return {
            text: value,
            prefix_key: null,
            suffix_key: 'p',
            description: descr,
            background_color: '#6a74b9',
            text_color: '#ffffff'
          }
        }
        return Object.entries(args).map(kv=> toLabel(kv[0], kv[1]))
      },
      makeChunks(text) {
        if (!text) {
          return []
        }
        return [{
          label: null,
          color: null,
          showMenu: false,
          text: text
        }]
      },
      show(e) {
        e.preventDefault()
        this.showMenu = false
        this.x = e.clientX || e.changedTouches[0].clientX
        this.y = e.clientY || e.changedTouches[0].clientY
        this.$nextTick(() => {
          this.showMenu = true
        })
      },
      setSpanInfo() {
        let selection
        // Modern browsers.
        if (window.getSelection) {
          selection = window.getSelection()
        } else if (document.selection) {
          selection = document.selection
        }
        // If nothing is selected.
        if (selection.rangeCount <= 0) {
          return
        }
        const range = selection.getRangeAt(0)
        const preSelectionRange = range.cloneRange()
        preSelectionRange.selectNodeContents(this.$el)
        preSelectionRange.setEnd(range.startContainer, range.startOffset)
        this.start = [...preSelectionRange.toString()].length
        let content = [...range.toString()]
        this.end = this.start + content.length
        if(content[content.length - 1] === ' ') {
          // trim
          this.end -=1
        }
      },
      validateSpan() {
        if ((typeof this.start === 'undefined') || (typeof this.end === 'undefined')) {
          return false
        }
        if (this.start === this.end) {
          return false
        }
        for (const arg of this.frame.args) {
          if ((arg.start <= this.start) && (this.end <= arg.end)) {
            // inside: reassign start and end
            this.start = arg.start
            this.end = arg.end
          } else if ((this.start <= arg.start) && (this.end > arg.start)) {
            // starts prior...can't go in..
            return false
          } else if ((this.start < arg.end) && (this.end > arg.end)) {
            // start in and ends after...
            return false
          }
        }
        return true
      },
      existingLabel() {
        if ((typeof this.start === 'undefined') || (typeof this.end === 'undefined')) {
          return false
        }
        if (this.start === this.end) {
          return false
        }
        for (const arg of this.frame.args) {
          if ((arg.start <= this.start) && (this.end <= arg.end)) {
            return arg.id
          }
        }
        return 0
      },
      open(e) {
        this.setSpanInfo()
        if (this.validateSpan()) {
          this.show(e)
        }
      },
      assignLabel(label) {
        if (this.validateSpan()) {
          const existing = this.existingLabel()
          if (existing) {
            this.updateArg(label, existing, this.frame.id)
          } else {
            this.addArg(this.start, this.end, label, this.frame.id)
          }
          this.showMenu = false
          this.start = 0
          this.end = 0
        }
      }
    }
  }
</script>

<style scoped>
  .highlight.blue {
    background: #edf4fa !important;
  }

  .highlight.bottom {
    display: block;
    white-space: normal;
  }

  .highlight:first-child {
    margin-left: 0;
  }

  .highlight {
    border: 2px solid;
    margin: 4px 6px 4px 3px;
    vertical-align: middle;
    box-shadow: 2px 4px 20px rgba(0, 0, 0, .1);
    position: relative;
    cursor: default;
    min-width: 26px;
    line-height: 22px;
    display: flex;
  }

  .highlight .delete {
    top: -15px;
    left: -13px;
    position: absolute;
    display: none;
  }

  .highlight:hover .delete {
    display: block;
  }

  .highlight__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 2px 2px 0px 6px;
  }

  .highlight.bottom .highlight__content:after {
    content: " ";
    padding-right: 3px;
  }

  .highlight__label {
    line-height: 14px;
    padding-top: 1px;
    align-items: center;
    justify-content: center;
    display: flex;
    padding: 0 8px;
    text-align: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    color: white;
  }

  .highlight__label::after {
    content: attr(data-label);
    display: block;
    font-size: 14px;
    -webkit-font-smoothing: subpixel-antialiased;
    letter-spacing: .1em;
  }

  .highlight-container.highlight-container--bottom-labels {
    align-items: flex-start;
  }

  .highlight-container {
    line-height: 42px !important;
    display: flex;
    flex-wrap: wrap;
    white-space: pre-wrap;
    cursor: default;
  }

  .highlight-container.highlight-container--bottom-labels .highlight.bottom {
    margin-top: 6px;
  }

  .predicate {
    text-decoration: underline;
  }
</style>