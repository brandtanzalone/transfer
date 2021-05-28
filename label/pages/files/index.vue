<template>
  <v-card class="mx-auto">
    <v-toolbar dark color="blue darken-3">
      <v-toolbar-title>Chats</v-toolbar-title>
    </v-toolbar>
    <v-data-table :headers="headers" :items="fakechat" :items-per-page="13">
      <template v-slot:item="row">
          <tr>
            <td>{{row.item.time}}</td>
            <td>{{row.item.author}}</td>
            <td>{{row.item.message}}</td>
            <td>
              <v-btn class="mx-2" medium>
                <v-icon dark @click="predicates(row.item)">mdi-alpha-p</v-icon>
              </v-btn>
              <v-btn class="mx-2" medium>
                <v-icon dark @click="args(row.item)">mdi-alpha-a</v-icon>
              </v-btn>
            </td>
          </tr>
      </template>
    </v-data-table> 
     <!-- <v-data-table :headers="headers" :items="chats" :items-per-page="13"> 
      <template v-slot:[`item`]="props">
        <tr>
          <td align="start">{{props.item.time}}</td>
          <td>{{props.item.frames}}</td>
          <td><v-icon title="view predicates" medium @click="predicates(props.item.name)"> mdi-alpha-p </v-icon></td>
          <td><v-icon title="view arguments" medium @click="args(props.item.name)"> mdi-alpha-a </v-icon></td>
        </tr>
      </template>
    </v-data-table> -->
  </v-card>
</template>

<script> 
export default {
  data () {
    return {
      dialog: false,
      socket: null, 
      fakechat: [
        {
          "time": "one",
          "message": "test me",
          "author": "me",
          "frames": []
        }
      ]
    };
  },
  created () {
    this.socket = new WebSocket('ws://localhost:8766');
    
    this.socket.onopen = (event) => {
      console.log('started')
      this.socket.onmessage = (event) => {
      //mutate store
      this.$store.dispatch(JSON.parse("files/addChat"), {event})
      console.log(event)
      };
      this.socket.onerror = (event) => {
      //mutate store
      console.error(event)
      };
      //mutate store
      console.log(event)
    };
  },
  computed: {
    /**
     * Defines the files data. 
     */
    chats() {
      console.log('load chats', this.$store.getters["files/getChats"])
      return this.$store.getters["files/getChats"];
    },
    /**
     * Defines the headers for the data table. 
     */
    headers() {
      return [
        {
          text: "snippet",
          align: "start",
          value: "time"
        },
        { text: "author", value: 'sender'},
        { text: "chat", value: 'messages' }
      ]
    }, 
    numberOfPages() {
      return Math.ceil(this.docs.length / this.itemsPerPage);
    },
  },
  methods: {
    /**
     * Refresh the file store. 
     */
    
    nextPage() {
      if (this.page + 1 <= this.numberOfPages) this.page += 1;
    },
    formerPage() {
      if (this.page - 1 >= 1) this.page -= 1;
    },
    updateItemsPerPage(number) {
      this.itemsPerPage = number;
    },
    predicates(chat){
      this.$router.push({path: `/srl/preds`, query: {doc: chat}})
    },
    args(chat){
      this.$router.push({path: `/srl/args`, query: {doc: chat}})
    },
    clearAll() {
      //TODO: implement and add a confirmation
      console.warn('remove all files - not yet implemented');
    },
    /**
     * View predicates for the file.
     */
    // predicates(file) {
    //   this.$router.push({ path: `/srl/preds`, query: { doc: file } });
    // },
    // /**
    //  * View arguments for the file.
    //  */
    // args(file) {
    //   this.$router.push({ path: `/srl/args`, query: { doc: file } });
    // }
  }
};
</script>

<style scoped>
  input {
    color: white;
  }
  input::placeholder{
    color: grey;
  }
  .model-select {
    border-bottom: solid 1px grey;
    margin-right: 10px;
    color: white;
  }
</style>
