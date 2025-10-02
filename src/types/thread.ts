export type Message = {
  id: string;
  content: string;
  createdAt: string;
  tripcode: string;
  imageUrl?: string;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: string;
  boardKey?: string; // clé du board (ex: "b", "tech") – optionnel pour compat avec anciennes réponses
  messages: Message[];
};
