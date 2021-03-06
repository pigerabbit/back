export function getRequiredInfoFromPostData(data) {
  if (data.type === "cs") {
    return {
      postId: data.postId,
      groupId: data.groupId,
      type: data.type,
      authorizedUsers: data.authorizedUsers,
      writer: data.writer,
      receiver: data.receiver,
      title: data.title,
      content: data.content,
      postImg: data.postImg,
      commentCount: data.commentCount,
      reply: data.reply,
      removed: data.removed,
      createdAt: data.createdAt,
    };
  } else { 
    return {
      postId: data.postId,
      groupId: data.groupId,
      type: data.type,
      authorizedUsers: data.authorizedUsers,
      writer: data.writer,
      receiver: data.receiver,
      title: data.title,
      content: data.content,
      postImg: data.postImg,
      commentCount: data.commentCount,
      removed: data.removed,
      createdAt: data.createdAt,
    };
  }
}
