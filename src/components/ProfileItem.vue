<template lang="pug">
.profile-item
  ul.head
    li.item: button.button(@click="createChatWindow", v-if="!existChatWin") Open Chat Window
    li.item: button.button(@click="closeChatWindow", v-if="existChatWin") Close Chat Window

    li.item: button.button(@click="deleteSelf") Delete The Profile

  form.form
    //- label.label(for="id") ID
    //- input.input.-id(id="id", type="text", :value="id", readonly)

    label.label(for="name") Name
    input.input.-name(id="name", type="text", :value="name", @input="$emit('update:name', $event.target.value)")

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

    label.label(for="alwaysOnTop") Always on Top
    input.input(id="alwaysOnTop", type="checkbox" v-model="alwaysOnTop")

    label.label(for="clickable") Clickable
    input.input(id="clickable", type="checkbox" v-model="clickable")
</template>

<script lang="coffee">
import electron from "electron"
import debounce from "lodash.debounce"

import watchable from "@/scripts/mixins/watchable.coffee"

export default
  mixins: [
    watchable
  ]
  props:
    id:
      type: String
      required: true
    name:
      type: String
      required: true
  data: ->
    # name: 'New Profile'
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
    strageName: -> "chat-win-settings-#{@id}"
    urlType: -> if @urlVisible then 'url' else 'password'
    chatWindowBackgroundColor: ->
      alpha = if @bgOpacity == 1 then 'fe' else ('00' + Math.round(@bgOpacity * 255).toString(16)).slice(-2)
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
        @_chatWin = undefined
        @existChatWin = false
      @_chatWin.on 'resize', => @setPosition()
      @_chatWin.on 'move', => @setPosition()

      @_chatWin.once 'ready-to-show', =>
        @_chatWin.webContents.executeJavaScript(
          """
            document.body.setAttribute('style', '-webkit-user-select: none;-webkit-app-region: drag;');
          """
        )
        @_chatWin.showInactive()

      # @_chatWin.webContents.on 'did-finish-load', =>
      #   console.log 'did-finish-load'
      #   @_chatWin.webContents.send('asynchronous-message', 'whoooooooh')
      #   @_chatWin.webContents.send('ping', 'whoooooooh!')

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
      localStorage.setItem @strageName, JSON.stringify(data)
      console.log "saved to localStorage: #{@id}"
    lodeChatWinSettingsFromLocalStorage: ->
      dataStr = localStorage.getItem @strageName

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
    deleteLocalStoregeData: ->
      localStorage.removeItem @strageName
    deleteSelf: ->
      if window.confirm('Are you sure?')
        @closeChatWindow()
        @deleteLocalStoregeData()
        @$emit('delete', @id)
  created: ->
    @lodeChatWinSettingsFromLocalStorage()

    @watchValues [
      # 'name'
      'url'
      'width'
      'height'
      'positionX'
      'positionY'
      'winOpacity'
      'bgOpacity'
      'alwaysOnTop'
      'clickable'
    ], debounce(((_nweVal, _oldVal) => @saveChatWinSettingsToLocalStorage()), 1000)

    electron.ipcRenderer.on 'asynchronous-reply', (event, arg) =>
      console.log(arg)
    electron.ipcRenderer.send('asynchronous-message', 'ping')
</script>

<style lang="scss" scoped>
.profile-item {
  > .head {
    position: sticky;
    top: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: var(--space-size-m);

    background: var(--color-night);

    > .item {
      &:not(:last-child) { margin-right: var(--space-size-m); }
    }
  }

  > .form {
    display: grid;
    grid-gap: var(--space-size-l);
    grid-template-columns: max-content 1fr;
    align-items: baseline;

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
        min-width: 38em;
      }

      // &.-width { text-align: right; }
      // &.-height { text-align: right; }
      // &.-opacity { text-align: right; }
    }
  }
}
</style>
