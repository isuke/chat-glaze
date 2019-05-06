<template lang="pug">
#app
  h1.title Chat Glaze
  h2.version {{ version }}

  form.form
    label.label(for="url")
      | URL
      span.mark(@click.prevent="urlVisible = !urlVisible") {{urlVisible ? '⦰' : '⦾'}}
    input.input.-url(id="url", :type="urlType", v-model="url", placeholder="https://streamlabs.com/widgets/chat-box/v1/XXXXXXXXXXXXXXXXXXXX")

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

    label.label(for="winOpacityOnHover") Window Opacity (On Hover)
    input.input.-winOpacityOnHover(id="winOpacityOnHover", type="number", min="0", max="1", step="0.1", v-model.number="winOpacityOnHover")

    label.label(for="bgOpacityOnHover") Background Opacity (On Hover)
    input.input.-bgOpacityOnHover(id="bgOpacityOnHover", type="number", min="0", max="1", step="0.1", v-model.number="bgOpacityOnHover")

    label.label(for="alwaysOnTop") alwaysOnTop
    input.input(id="alwaysOnTop", type="checkbox" v-model="alwaysOnTop")

    label.label(for="clickable") clickable
    input.input(id="clickable", type="checkbox" v-model="clickable")

    input.button(type="button", value="Open Chat Window", @click="createChatWindow", v-if="!existChatWin")
    input.button(type="button", value="Close Chat Window", @click="closeChatWindow", v-if="existChatWin")
</template>

<script lang="coffee">
import electron from "electron"

import pkg from "../package.json"

export default
  data: ->
    version: pkg.version
    url: ''
    urlVisible: false
    width: 400
    height: 800
    positionX: 0
    positionY: 0
    winOpacity: 0.5
    bgOpacity: 0.1
    winOpacityOnHover: 0.9
    bgOpacityOnHover: 0.1
    alwaysOnTop: false
    clickable: true
    existChatWin: false
    isDevelopment: true # process.env.NODE_ENV != 'production'
    _chatWin: undefined
  computed:
    urlType: -> if @urlVisible then 'url' else 'password'
    chatWindowBackgroundColor: ->
      alpha = if @bgOpacity == 1 then 'fe' else ('00' + Math.round(@bgOpacity * 255).toString(16)).slice(-2)
      "##{alpha}000000"
    chatWindowBackgroundColorOnHover: ->
      alpha = if @bgOpacityOnHover == 1 then 'fe' else ('00' + Math.round(@bgOpacityOnHover * 255).toString(16)).slice(-2)
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
        show: false
        frame: false
        titleBarStyle: 'customButtonsOnHover'
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

      @_chatWin.once 'ready-to-show', => @setupChatWindow()

      @existChatWin = true
    setupChatWindow: ->
      contents = @_chatWin.webContents

      contents.executeJavaScript(
        """
          document.body.setAttribute('style', '-webkit-user-select: none;-webkit-app-region: drag;');

          document.addEventListener('mouseenter', () => console.log('__mouseenter__'));
          document.addEventListener('mouseleave', () => console.log('__mouseleave__'));
        """
      )

      contents.on 'console-message', (_event, _level, message, _line, _sourceId) =>
        if message == '__mouseenter__'
          @_chatWin.setOpacity @winOpacityOnHover
          @_chatWin.setBackgroundColor @chatWindowBackgroundColorOnHover
        else if message == '__mouseleave__'
          @_chatWin.setOpacity @winOpacity
          @_chatWin.setBackgroundColor @chatWindowBackgroundColor

      @_chatWin.showInactive()
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
        winOpacityOnHover: @winOpacityOnHover
        bgOpacityOnHover:  @bgOpacityOnHover
        alwaysOnTop: @alwaysOnTop
        clickable:   @clickable
      }
      localStorage.setItem 'chat-win-settings', JSON.stringify(data)
    lodeChatWinSettingsFromLocalStorage: ->
      dataStr = localStorage.getItem 'chat-win-settings'

      return unless dataStr

      data = JSON.parse dataStr
      @url         = data.url        || ''
      @width       = data.width      || false
      @height      = data.height     || 400
      @positionX   = data.positionX  || 800
      @positionY   = data.positionY  || 0
      @winOpacity  = data.winOpacity || 0
      @bgOpacity   = data.bgOpacity  || 0.1
      @winOpacityOnHover = data.winOpacityOnHover || 0.9
      @bgOpacityOnHover  = data.bgOpacityOnHover  || 0.1
      @alwaysOnTop = data.alwaysOnTop || false
      @clickable   = data.clickable   || false
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
    margin-bottom: var(--space-size-s);
  }

  > .version {
    font-size: var(--ft-size-m);
    margin-bottom: var(--space-size-xxl);

    &::before { content: "- "; }
    &::after { content: " α -"; }
  }

  > .form {
    display: grid;
    grid-gap: var(--space-size-l);
    grid-template-columns: max-content 1fr;
    margin-bottom: var(--space-size-xxl);

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
        min-width: 25em;
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
