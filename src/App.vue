<template lang="pug">
#app
  h1.title Chat Glaze

  form.form
    label.label(for="url")
      | URL
      span.mark(@click="urlVisible = !urlVisible") {{urlVisible ? '⦰' : '⦾'}}
    input.input.-url(id="url", :type="urlType", v-model="url")

    label.label(for="width") Width
    input.input.-width(id="width", type="number", min="100", v-model.number.lazy="width")

    label.label(for="height") Height
    input.input.-height(id="height", type="number", min="100", v-model.number.lazy="height")

    label.label(for="opacity") Opacity
    input.input.-opacity(id="opacity", type="number", min="0", max="1", step="0.1", v-model.number="opacity")

    label.label(for="alwaysOnTop") alwaysOnTop
    input.input(id="alwaysOnTop", type="checkbox" v-model="alwaysOnTop")

    label.label(for="clickable") clickable
    input.input(id="clickable", type="checkbox" v-model="clickable")

    input.button(type="button", value="Open Chat Window", @click="createChatWindow", v-if="!existChatWin")
    input.button(type="button", value="Close Chat Window", @click="closeChatWindow", v-if="existChatWin")
</template>

<script lang="coffee">
import electron from "electron"

export default
  data: ->
    url: 'https://www.google.com/'
    urlVisible: false
    width: 400
    height: 800
    opacity: 1
    alwaysOnTop: false
    clickable: true
    existChatWin: false
    _chatWin: undefined
  computed:
    urlType: -> if @urlVisible then 'url' else 'password'
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

<style lang="scss" scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;

  > .title {
    font-size: var(--ft-size-xxl);
    margin-top: var(--space-size-xxl);
    margin-bottom: var(--space-size-xxl);
  }

  > .form {
    display: grid;
    grid-gap: var(--space-size-l);
    grid-template-columns: max-content 1fr;

    > .label {
      grid-column: 1;
      text-align: right;

      > .mark {
        font-size: var(--ft-size-l);
        margin-left: var(--space-size-xs);
        margin-right: var(--space-size-xs);
      }
    }

    > .input {
      grid-column: 2;

      &.-url {
        min-width: 20rem;
      }

      // &.-width { text-align: right; }
      // &.-height { text-align: right; }
      // &.-opacity { text-align: right; }
    }

    > .button {
      grid-column: span 2;
    }
  }
}
</style>
