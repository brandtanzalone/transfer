<template>
  <v-card
    class="mx-auto"
  >
    <v-toolbar
      dark
      color="blue darken-3"
    >
      <v-toolbar-title>Semantic Role Labeling Arguments</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="fontSize-=1" icon>
        <v-icon>mdi-format-font-size-decrease</v-icon>
      </v-btn>
      <v-btn icon @click="fontSize+=1">
        <v-icon>mdi-format-font-size-increase</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-view-module</v-icon>
      </v-btn>
    </v-toolbar>

    <v-container fluid>
      <v-data-iterator
        :items="frames"
        :items-per-page.sync="itemsPerPage"
        :page="page"
        no-data-text="No Frames"
        hide-default-footer
      >
        <template v-slot:default="props">
          <div v-for="frame in props.items">
            <v-container fluid>
              <v-row justify="center">
                <v-col cols="12" md="9">
                  <v-card>
                    <v-card-title>{{frame.predicate.label}}: {{predicateDescription(frame.predicate.label)}}</v-card-title>
                    <v-card-text>
                      <arg-labeler
                        :frame="frame"
                        :fontSize="fontSize"
                        >
                      </arg-labeler>
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
            Page {{ page?numberOfPages:0 }} of {{ numberOfPages }}
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

  import ArgLabeler from "~/components/ArgLabeler";
  import {createArg} from "~/common/frames";

  export default {
    layout: 'demo',
    name: "index.vue",
    components: {
      ArgLabeler
    },
    data: function () {
      return {
        fontSize: 16,
        itemsPerPageArray: [2, 4],
        filter: {},
        page: 1,
        itemsPerPage: 2
      }
    },
    computed: {
      numberOfPages() {
        return Math.ceil(this.frames.length / this.itemsPerPage)
      },
      frames: function () {
        return this.$store.getters['frames/filter'](this.$route.query)
      },
    },
    beforeMount() {

    },
    methods: {
      nextPage() {
        if (this.page + 1 <= this.numberOfPages) this.page += 1
      },
      predicateDescription(frame) {
        return this.$store.getters['propbank/getPredicateDescription'](frame)
      },
      allFrames() {
        this.$router.push({ path: `/srl/args/${this.$route.params.doc}`})
      },
      formerPage() {
        if (this.page - 1 >= 1) this.page -= 1
      },
      updateItemsPerPage(number) {
        this.itemsPerPage = number
      }
    }
  }
</script>

<style scoped>

</style>
