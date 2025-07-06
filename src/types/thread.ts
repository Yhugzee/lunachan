export type Message = {
  id: string;
  content: string;
  createdAt: string;
  tripcode: string;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};
