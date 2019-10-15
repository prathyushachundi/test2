export class Annotation {
  public uuid: string;
  constructor(public type: string, public comments: Comment[]) {}
}

export class Comment {
  constructor(public userId: string, public commentText: string, public createDate: Date) {}
}
