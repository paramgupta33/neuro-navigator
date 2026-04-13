import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react' // eslint-disable-line no-unused-vars
import { supabase } from '../lib/supabase'
import { buildNeuroNavLocationDataset } from '../lib/locationAiContext'

async function fetchLiveDataset() {
  const [{ data: locs, error: e1 }, { data: reps, error: e2 }] = await Promise.all([
    supabase.from('locations').select('id, name, category, lat, lng'),
    supabase.from('sensory_reports').select('*'),
  ])
  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)
  return buildNeuroNavLocationDataset(locs ?? [], reps ?? [])
}

export function NeuroNavChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Neuro-Inclusive Navigator. How can I help you find a calm space today?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, isLoading])

  const handleSend = useCallback(async (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    setError(null)

    try {
      const dataset = await fetchLiveDataset()
      const datasetJson = JSON.stringify(dataset, null, 2)
      
      const systemPrompt = `You are NeuroNav's calm assistant helping neurodivergent people find sensory-friendly places. 
You have access to live location data and their sensory scores (1-10, where higher is calmer). 
Be warm, gentle, and concise. When someone describes their needs, suggest specific locations from the provided data and explain briefly why they match based on their sensory scores and reports. 
If data is sparse, say so kindly. Do not invent places not listed in the data.

Live location data:
${datasetJson}

`

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is missing in environment variables.')
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: systemPrompt + userMessage,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API')
      }

      const data = await response.json()
      const botResponse = data.candidates[0].content.parts[0].text

      setMessages((prev) => [...prev, { role: 'assistant', content: botResponse }])
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  return (
    <div className="fixed bottom-6 right-6 z-[3000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 z-[3000] flex h-full w-full flex-col overflow-hidden bg-[#1a1108] sm:absolute sm:bottom-20 sm:right-0 sm:h-[600px] sm:max-h-[calc(100vh-120px)] sm:w-[400px] sm:max-w-[calc(100vw-3rem)] md:w-[30vw] sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#1a1108]/95 sm:backdrop-blur-2xl sm:shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-grass/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grass/20 text-grass">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">NeuroNav Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-grass animate-pulse" />
                    <span className="text-[10px] font-bold text-grass/80 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-hide"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-wheat text-[#1a1108] rounded-tr-none shadow-lg'
                        : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-white/40 border border-white/5 rounded-tl-none">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs font-medium">Thinking...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-red-500/10 p-3 border border-red-500/20">
                  <p className="text-center text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-white/5 p-4 sm:p-6 bg-black/40 backdrop-blur-md">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about sensory spaces..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 pr-14 text-sm text-white placeholder:text-white/20 focus:border-grass/50 focus:outline-none focus:ring-1 focus:ring-grass/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-grass hover:bg-grass/10 disabled:opacity-20 transition-all"
                >
                  <Send size={22} />
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] text-white/20 font-medium uppercase tracking-widest">
                Powered by Gemini AI
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white/10 text-white rotate-90' : 'bg-grass text-[#1a1108]'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>
    </div>
  )
}
