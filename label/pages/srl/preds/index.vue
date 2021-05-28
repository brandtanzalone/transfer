<template>
  <v-card
    class="mx-auto"
  >
    <v-toolbar
      dark
      color="blue darken-3"
    >
      <v-toolbar-title>Semantic Role Labeling Predicates</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="fontSize-=1" icon>
        <v-icon>mdi-format-font-size-decrease</v-icon>
      </v-btn>
      <v-btn icon @click="fontSize+=1">
        <v-icon>mdi-format-font-size-increase</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-toolbar>
    <v-container fluid>
      <v-data-iterator
        :items="annotatedText"
        :items-per-page.sync="itemsPerPage"
        :page="page"
        :search="search"
        hide-default-footer
      >
        <template v-slot:default="props">
          <div v-for="item in props.items">
            <v-container fluid>
              <v-row justify="center">
                <v-col cols="12" md="9">
                  <v-card>
                    <v-card-text>
                      <pred-labeler
                        :fontSize="fontSize"
                        :text="item.text"
                        :doc="item.doc"
                        :sent="item.sent"
                        :frames="item.frames"
                      >
                      </pred-labeler>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </div>
        </template>
        <template v-slot:footer>
          <v-row class="mt-2" align="center" justify="center">
            <span class="grey--text">Items per page</span>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  dark
                  text
                  color="primary"
                  class="ml-2"
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ itemsPerPage }}
                  <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(number, index) in itemsPerPageArray"
                  :key="index"
                  @click="updateItemsPerPage(number)"
                >
                  <v-list-item-title>{{ number }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-spacer></v-spacer>

            <span
              class="mr-4
            grey--text"
            >
            Page {{ page }} of {{ numberOfPages }}
          </span>
            <v-btn
              fab
              dark
              color="blue darken-3"
              class="mr-1"
              @click="formerPage"
            >
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-btn
              fab
              dark
              color="blue darken-3"
              class="ml-1"
              @click="nextPage"
            >
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </v-row>
        </template>
      </v-data-iterator>
    </v-container>
  </v-card>
</template>


<script>
  import PredLabeler from "../../../components/PredLabeler"
  import {createFrame} from '~/common/frames'

  export default {
    layout: 'demo',
    components: {PredLabeler},
    data: function () {
      return {
        fontSize: 16,
        itemsPerPageArray: [2, 4],
        page: 1,
        itemsPerPage: 2,
        search: ''
      }
    },
    computed: {
      numberOfPages() {
        return Math.ceil(this.annotatedText.length / this.itemsPerPage)
      },
      annotatedText: function () {
        const text2Annotations = {}
        let frames = []
        if (this.$route.query.doc) {
          // examining a document
          const sentences = this.$store.getters['text/doc'](this.$route.query.doc)
          frames = this.$store.getters['frames/filter']({'doc': this.$route.query.doc})
          return sentences.map((s) => {
            return {
              doc: s.doc,
              sent: s.id,
              text: s.text,
              frames: frames.filter((f) => f.sent === s.id)
            }
          })
        } else if (this.$route.query.frameType) {
          // examining a certain frame type
          frames = this.$store.getters['frames/filter']({'frameType': this.$route.query.frameType})
        } else if (this.$route.query.frame) {
          // examining a specific frame
          frames = this.$store.getters['frames/filter']({'frame': this.$route.query.frame})
        } else {
          // all
          frames = this.$store.state.frames.frames
          const sentences = this.$store.state.text.sentences
          return sentences.map((s) => {
            return {
              doc: s.doc,
              sent: s.id,
              text: s.text,
              frames: frames.filter((f) => f.sent === s.id)
            }
          })
        }
        frames.forEach(function (f) {
          if (!(f.sent in text2Annotations)) {
            text2Annotations[f.sent] = {
              doc: f.doc,
              sent: f.sent,
              test: f.text,
              frames: []
            }
          }
          text2Annotations[f.sent].frames.push(f)
        })
        return Object.values(text2Annotations)
      }
    }
    ,
    methods: {
      nextPage() {
        if (this.page + 1 <= this.numberOfPages) this.page += 1
      }
      ,
      formerPage() {
        if (this.page - 1 >= 1) this.page -= 1
      }
      ,
      updateItemsPerPage(number) {
        this.itemsPerPage = number
      }
    }
  }
</script>

<style scoped>

</style>
