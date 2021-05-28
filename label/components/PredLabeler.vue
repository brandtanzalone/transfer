<template>
  <div @click="open" @touchend="open" class="highlight-container highlight-container--bottom-labels">
    <template>
      <span
        v-for="(chunk, i) in chunks"
      >
        <span :style="{ borderColor: chunk.color ? chunk.color : 'unset', fontSize: fontSize + 'px'}"
              :class="{highlight: chunk.label, bottom: chunk.label}"><span :class="{highlight__content: chunk.label}">{{ chunk.text }}<v-icon
          v-if="chunk.label"
          @click.stop="removeFrame(chunk.id)"
          class="delete">mdi-close-circle</v-icon><v-icon v-if="chunk.label"
                                                          @click.stop="gotoArg(chunk.id)"
                                                          class="arg">mdi-alpha-a-circle</v-icon></span><span
          :data-label="chunk.label" :style="{ backgroundColor: chunk.color, color: textColor }"
          class="highlight__label"/>
      </span>
      </span>
    </template>
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
          v-for="(label, i) in suggested"
          :key="i"
          v-shortkey="[label.suffix_key]"
          @shortkey="assignLabel(label.text)"
          @click="assignLabel(label.text)"
        >
          <v-list-item-content>
            <v-list-item-title v-text="label.text"/>
          </v-list-item-content>
          <v-list-item-action>
            <v-list-item-action-text v-text="label.suffix_key"/>
          </v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item>
          <v-autocomplete
            :items="all"
            hide-no-data
            @click.stop.prevent
            hide-selected
            label="All"
            @change="change"
            placeholder="Search..."
            prepend-icon="mdi-database-search"
            return-object
          ></v-autocomplete>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
  import {idealColor} from '~/common/colors'
  import {normMap} from "../common/normalize";
  import {createFrame} from "../common/frames";

  export default {
    name: "PredLabeler",
    data: function () {
      return {
        showMenu: false,
        x: 0,
        y: 0,
        start: 0,
        end: 0
      }
    },
    props: {
      text: {
        type: String,
        required: true
      },
      doc: {
        type: String,
        required: true
      },
      sent: {
        type: String,
        required: true
      },
      frames: {
        type: Array,
        required: true
      },
      fontSize: {
        type: Number,
        default: 16
      }
    },
    computed: {
      suggested() {
        if (this.start === this.end) {
          return []
        }
        return this.suggestedLabels(this.text.substring(this.start, this.end))
      },
      all() {
        const values = []
        for (let senses of Object.values(this.$store.state.propbank.predicates)) {
          senses.forEach((s) => {
            values.push(s.label)
          })
        }
        return values
      },
      sortedFrames() {
        return this.frames.slice().sort((a, b) => a.predicate.start - b.predicate.start)
      },
      chunks: function () {
        let chunks = []
        const frames = this.sortedFrames
        let startOffset = 0
        for (const frame of frames) {
          chunks = chunks.concat(this.makeChunks(this.text.slice(startOffset, frame.predicate.start)))
          chunks.push({
            id: frame.id,
            label: frame.predicate.label,
            color: '#e6d176',
            showMenu: false,
            text: this.text.slice(frame.predicate.start, frame.predicate.end)
          })
          startOffset = frame.predicate.end
        }
        chunks = chunks.concat(this.makeChunks(this.text.slice(startOffset, this.text.length)))
        return chunks
      }
    },
    watch: {},
    methods: {
      suggestedLabels(text) {
        let raw = new Set()
        raw.add(text)
        if (text in normMap) {
          raw.add(normMap[text])
        }
        raw.add(lemmatizer.verb(text))
        raw.add(lemmatizer.noun(text))
        raw.add(lemmatizer.adjective(text))
        const lemmas = new Set()
        raw.forEach((rawValue) => {
          if(rawValue in this.$store.state.propbank.predicates) {
            this.$store.state.propbank.predicates[rawValue].forEach((sense) => {
              lemmas.add(sense['label'])
            })
          }
        })

        const values = [...lemmas]
        return values.map(v => this.toLabel(v))
      },
      toLabel(value) {
        return {
          text: value,
          prefix_key: null,
          suffix_key: 'p',
          background_color: '#6a74b9',
          text_color: '#ffffff'
        }
      },
      change(label) {
        if (label) {
          this.assignLabel(label)
        }
        this.showMenu = false

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
      validateSpan() {
        if ((typeof this.start === 'undefined') || (typeof this.end === 'undefined')) {
          return false
        }
        if (this.start === this.end) {
          return false
        }
        for (const frame of this.frames) {
          if ((frame.start_offset <= this.start) && (this.start < frame.end_offset)) {
            return false
          }
          if ((frame.start_offset < this.end) && (this.end <= frame.end_offset)) {
            return false
          }
          if ((this.start < frame.start_offset) && (frame.end_offset < this.end)) {
            return false
          }
        }
        return true
      },
      assignLabel(label) {
        if (this.validateSpan()) {
          this.addFrame(createFrame(this.doc, this.sent, this.text, label, this.start, this.end))
          this.showMenu = false
          this.start = 0
          this.end = 0
        }
      },
      addFrame(frame) {
        this.$store.dispatch('frames/add_frame', frame)
      },
      removeFrame(frame) {
        this.$store.dispatch('frames/remove_frame', {id: frame})
      },
      setSpanInfo() {
        let selection = window.getSelection()
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
        if (content[content.length - 1] === ' ') {
          // trim
          this.end -= 1
        }
      },
      open(e) {
        this.setSpanInfo()
        if (this.validateSpan()) {
          this.show(e)
        }
      },
      textColor() {
        return idealColor(this.color)
      },
      gotoArg(frameId) {
        this.$router.push({path: "/srl/args", query: {'frame': frameId}})
      }
    }
  }
</script>

<style scoped>
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


  .highlight .arg {
    top: -15px;
    right: -13px;
    position: absolute;
    display: none;
  }

  .highlight:hover .arg {
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
</style>
