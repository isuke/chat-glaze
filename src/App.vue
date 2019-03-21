<template lang="pug">
#app
  h1 This is App.vue

  label
    | URL
    input.url(type="password", v-model="url")
  label
    | Width
    input(type="number", min="100", v-model.number.lazy="width")
  label
    | Height
    input(type="number", min="100", v-model.number.lazy="height")
  label
    | Opacity
    input(type="number", min="0", max="1", step="0.1", v-model.number="opacity")
  label
    | alwaysOnTop
    input(type="checkbox" v-model="alwaysOnTop")
  label
    | clickable
    input(type="checkbox" v-model="clickable")

  button(@click="createChatWindow", v-if="!existChatWin") GO
  button(@click="closeChatWindow", v-if="existChatWin") Close
</template>

<script lang="coffee">
import electron from "electron"

export default
  data: ->
    url: 'https://www.google.com/'
    width: 400
    height: 800
    opacity: 1
    alwaysOnTop: false
    clickable: true
    existChatWin: false
    _chatWin: undefined
  watch:
    width: (val) ->
      return unless @existChatWin
      @_chatWin.setSize val, @height, true
    height: (val) ->
      return unless @existChatWin
      @_chatWin.setSize @width, val, true
    opacity: (val) ->
      return unless @existChatWin
      @_chatWin.setOpacity val
    alwaysOnTop: (val) ->
      return unless @existChatWin
      @_chatWin.setAlwaysOnTop val
    clickable: (val) ->
      return unless @existChatWin
      @_chatWin.setIgnoreMouseEvents !val
  methods:
    createChatWindow: ->
      return if @existChatWin || !@url

      @_chatWin = new electron.remote.BrowserWindow
        # transparent: true
        width: @width
        height: @height
        opacity: @opacity
        alwaysOnTop: @alwaysOnTop
        webPreferences:
          nodeIntegration: false

      @_chatWin.setIgnoreMouseEvents !@clickable
      @_chatWin.loadURL @url

      @_chatWin.on 'closed', =>
        @_chatWin = undefined
        @existChatWin = false

      @_chatWin.on 'will-resize', (rectangle) =>
        size = rectangle.sender.getSize()
        @width  = size[0]
        @height = size[1]

      @existChatWin = true
    closeChatWindow: ->
      return unless @existChatWin

      @_chatWin.close()
      @_chatWin = undefined
      @existChatWin = false
</script>

<style lang="scss">
#app {
  // font-family: "Avenir", Helvetica, Arial, sans-serif;
  // -webkit-font-smoothing: antialiased;
  // -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  // color: #2c3e50;
  // margin-top: 60px;
}
</style>
