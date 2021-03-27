# Serverless TODO social network
* In this capstone project, I inherited from course-4 serverless TODO project, and extended with social network functionalitiy
    * able to follow other users.
    * able to see newsfeed (actually TodosFeed: followees's TODOs).
    * follower will be notified when someone followed you.
* Technique stack
    * nodejs, typescript, aws-sdk
    * DynamoDB Stream, Websocket

# Issues
* for connection URL, I have to give speicific permission in the sendNotification function: `execute-api:ManageConnections`
* I noticed one weird issue: some functions always got `internal server error` in 20 min. And I got them available later with any actions. But I only encountered this twice till now (30 deploys)
    * just encountered again when upload image. No log in `GenerateUploadUrl`. I'm able to upload 2 min later.
    * I guess the issue is with cold-start, since all functions are same size: 22.1MB!

# Screenshots

*  Notify followee, once someone followed him/her, while followee is connected with websocket. ![](screenshots/sendFollowNotification-ws.png)

* 