<template lang="pug">
#app
  h1.title Chat Glaze

  ul.list
    li.item.-prpfile(
      v-for="profile in profileList",
      :key="profile.id",
      @click.prevent="currentProfileId = profile.id",
      :class="{ '-current': currentProfileId == profile.id }"
    ) {{ profile.name }}
    li.item.-add(@click.prevent="addProfile", :class="{ '-only': profileList.length == 0 }")
      | + Add Profile

  profile-item.profile(
    v-for="profile in profileList",
    :key="profile.id",
    :id="profile.id",
    :name="profile.name",
    @update:name="profile.name = $event",
    @delete="deleteProfile"
    v-show="profile.id === currentProfileId")
</template>

<script lang="coffee">
import nanoid   from "nanoid"

import ProfileItem from "@/components/ProfileItem.vue"

export default
  components:
    "profile-item": ProfileItem
  data: ->
    currentProfileId: undefined
    profileList: []
  watch:
    profileList:
      handler: -> @saveProfileList()
      deep: true
  methods:
    addProfile: ->
      id = nanoid(10)
      @profileList.push { id: id, name: 'New Profile' }
      @currentProfileId = id
    saveProfileList: ->
      localStorage.setItem 'chat-win-profile-list', JSON.stringify(@profileList)
    loadProfileList: ->
      dataStr = localStorage.getItem 'chat-win-profile-list'

      return unless dataStr

      @profileList = JSON.parse dataStr

      @currentProfileId = @profileList[0].id
    deleteProfile: (id) ->
      index = @profileList.findIndex (profile) => profile.id == id
      return if index < 0
      @profileList.splice(index, 1)

      @currentProfileId = if @profileList[0] then @profileList[0].id else undefined
  created: ->
    @loadProfileList()

    @addProfile() if @profileList.length == 0

    localStorage.removeItem 'chat-win-settings' # remove old data
</script>

<style lang="scss" scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-size-m);
  margin-top: var(--space-size-xl);
  margin-bottom: var(--space-size-xl);

  > .title {
    font-size: var(--ft-size-xxl);
    margin-bottom: var(--space-size-xl);
  }

  > .list {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    width: 100%;
    border-bottom: var(--border-height) var(--color-day) solid;

    > .item {
      background-color: var(--color-night);
      padding: var(--space-size-s) var(--space-size-l);

      transform: translateY(var(--border-height));

      @ghost border-top-radius(var(--border-radius));

      &.-prpfile {
        &.-current {
          border-top:    var(--border-height) var(--color-day) solid;
          border-left:   var(--border-height) var(--color-day) solid;
          border-right:  var(--border-height) var(--color-day) solid;
          border-bottom: var(--border-height) var(--color-night) solid;

          cursor: default;
        }
        &:not(.-current) {
          cursor: pointer;
        }
      }

      &.-add {
        font-weight: bold;
        cursor: pointer;

        &.-only {
          border-bottom: var(--border-height) var(--color-day) solid;
        }
      }
    }
  }

  > .profile {
    margin-top: var(--space-size-l);
  }
}
</style>
