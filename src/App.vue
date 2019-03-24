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

    label.label(for="positionX") Position X
    input.input.-width(id="positionX", type="number", v-model.number.lazy="positionX")

    label.label(for="positionY") Position Y
    input.input.-height(id="positionY", type="number", v-model.number.lazy="positionY")

    label.label(for="winOpacity") Window Opacity
    input.input.-winOpacity(id="winOpacity", type="number", min="0", max="1", step="0.1", v-model.number="winOpacity")

    label.label(for="bgOpacity") Background Opacity
    input.input.-bgOpacity(id="bgOpacity", type="number", min="0", max="1", step="0.1", v-model.number="bgOpacity")

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
    url: ''
    urlVisible: false
    width: 400
    height: 800
    positionX: 0
    positionY: 0
    winOpacity: 1
    bgOpacity: 1
    alwaysOnTop: false
    clickable: true
    existChatWin: false
    _chatWin: undefined
  computed:
    urlType: -> if @urlVisible then 'url' else 'password'
    chatWindowBackgroundColor: ->
      alpha = ('00' + Math.round(@bgOpacity * 255).toString(16)).slice(-2)
      "##{alpha}000000"
  watch:
    width: (val) ->
      return unless @existChatWin
      @_chatWin.setSize val, @height, true
    height: (val) ->
      return unless @existChatWin
      @_chatWin.setSize @width, val, true
    positionX: (val) ->
      return unless @existChatWin
      @$nextTick => @_chatWin.setPosition val, @positionY, false
    positionY: (val) ->
      return unless @existChatWin
      @$nextTick => @_chatWin.setPosition @positionX, val, false
    winOpacity: (val) ->
      return unless @existChatWin
      @_chatWin.setOpacity val
    bgOpacity: (val) ->
      return unless @existChatWin
      @_chatWin.setBackgroundColor @chatWindowBackgroundColor
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
        transparent: true
        width: @width
        height: @height
        x: @positionX
        y: @positionY
        opacity: @winOpacity
        alwaysOnTop: @alwaysOnTop
        backgroundColor: @chatWindowBackgroundColor
        webPreferences:
          nodeIntegration: false

      @_chatWin.setIgnoreMouseEvents !@clickable
      @_chatWin.loadURL @url

      @_chatWin.on 'closed', =>
        @saveChatWinSettingsToLocalStorage()
        @_chatWin = undefined
        @existChatWin = false

      @_chatWin.on 'resize', => @setPosition()
      @_chatWin.on 'move', => @setPosition()

      @existChatWin = true
    closeChatWindow: ->
      return unless @existChatWin

      @_chatWin.close()
      @_chatWin = undefined
      @existChatWin = false
    setPosition: ->
      bounds = @_chatWin.getBounds()
      @width  = bounds.width
      @height = bounds.height
      @positionX = bounds.x
      @positionY = bounds.y
    saveChatWinSettingsToLocalStorage: ->
      data = {
        url:         @url
        width:       @width
        height:      @height
        positionX:   @positionX
        positionY:   @positionY
        winOpacity:  @winOpacity
        bgOpacity:   @bgOpacity
        alwaysOnTop: @alwaysOnTop
        clickable:   @clickable
      }
      localStorage.setItem 'chat-win-settings', JSON.stringify(data)
    lodeChatWinSettingsFromLocalStorage: ->
      dataStr = localStorage.getItem 'chat-win-settings'

      return unless dataStr

      data = JSON.parse dataStr
      @url         = data.url
      @width       = data.width
      @height      = data.height
      @positionX   = data.positionX
      @positionY   = data.positionY
      @winOpacity  = data.winOpacity
      @bgOpacity   = data.bgOpacity
      @alwaysOnTop = data.alwaysOnTop
      @clickable   = data.clickable
  created: ->
    @lodeChatWinSettingsFromLocalStorage()
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
