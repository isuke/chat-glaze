export default
  methods:
    watchValues: (dataNames, callback) ->
      dataNames.forEach (dataName) => @$watch dataName, callback
