"use client";

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Send, Loader2 } from 'lucide-react';
import { aiAssistedUserGuide } from '@/ai/flows/ai-assisted-user-guide';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'assistant';
  content: string;
}

export default function UserGuide() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');
    setIsLoading(true);

    try {
      const response = await aiAssistedUserGuide({ query: currentQuery });
      const assistantMessage: Message = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="rounded-full w-14 h-14 shadow-lg bg-accent hover:bg-accent/90 animate-in fade-in zoom-in-50 duration-500">
          <HelpCircle className="h-6 w-6 text-accent-foreground" />
          <span className="sr-only">Open User Guide</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>AI User Guide</SheetTitle>
          <SheetDescription>
            Ask a question about how to use the Durationator app.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 -mx-6" ref={scrollAreaRef}>
            <div className="px-6 py-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm rounded-lg px-4 py-2 shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
               {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-sm rounded-lg px-4 py-2 bg-secondary text-secondary-foreground flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
               )}
            </div>
          </ScrollArea>
        </div>
        <form onSubmit={handleSubmit} className="relative mt-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., How do I add a duration?"
            className="pr-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={isLoading || !query.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
