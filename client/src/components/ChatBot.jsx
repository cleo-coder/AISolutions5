// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaUserTie } from 'react-icons/fa';

// --- THESE DEFINITIONS MUST BE INCLUDED IN YOUR FILE ---
const commonPhrases = {
    en: {
        greeting: "Hello! How can I help you today?",
        thanks: "You're welcome!",
        how_are_you: "I'm a bot, so I don't have feelings, but I'm ready to assist you!",
        my_name: "I am your AI Assistant.",
        unknown: "I'm not sure I understand. Can you rephrase? Or would you like to speak to a human agent?",
        handover: "Please wait while I connect you to a human agent.",
        welcome_initial: "Hi there! I'm your AI Assistant.",
        welcome_suggestion1: "Ask me about products, events, or general inquiries.",
        welcome_suggestion2: "Type 'help' for common questions.",
        welcome_suggestion3: "Or, type 'human agent' to connect with someone.",
    },
    fr: {
        greeting: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
        thanks: "De rien !",
        how_are_you: "Je suis un bot, donc je n'ai pas de sentiments, mais je suis prêt à vous aider !",
        my_name: "Je suis votre assistant IA.",
        unknown: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ? Ou souhaitez-vous parler à un agent humain ?",
        handover: "Veuillez patienter pendant que je vous connecte à un agent humain.",
        welcome_initial: "Bonjour ! Je suis votre assistant IA.",
        welcome_suggestion1: "Posez-moi des questions sur les produits, les événements ou les demandes générales.",
        welcome_suggestion2: "Tapez 'aide' pour les questions courantes.",
        welcome_suggestion3: "Ou, tapez 'agent humain' pour parler à quelqu'un.",
    },
    tn: { // Setswana
        greeting: "Dumela! Nka go thusa ka eng gompieno?",
        thanks: "O amogelesegile!",
        how_are_you: "Ke bot, ga ke na maikutlo, mme ke ikemiseditse go go thusa!",
        my_name: "Ke Motlhokomedi wa gago wa AI.",
        unknown: "Ga ke tlhaloganye sentle. A o ka fetola? Kana o batla go bua le motho?",
        handover: "Tswee-tswee, ema pele ke go golaganye le motho.",
        welcome_initial: "Dumela! Ke Motlhokomedi wa gago wa AI.",
        welcome_suggestion1: "Mpotse ka ditlhagiswa, ditiragalo, kgotsa dipotso ka kakaretso.",
        welcome_suggestion2: "Kwala 'thusho' go bona dipotso tse di tlwaelegileng.",
        welcome_suggestion3: "Kgotsa, kwala 'motho' go golagana le mongwe.",
    },
};

const FAQ = [
    {
        keywords: ['help', 'aide', 'thusho'],
        answers: {
            en: "I can help with questions about our products, upcoming events, or connecting you to a human agent. Just type your query!",
            fr: "Je peux vous aider avec des questions sur nos produits, les événements à venir ou vous connecter à un agent humain. Tapez simplement votre question !",
            tn: "Nka go thusa ka dipotso ka ditlhagiswa tsa rona, ditiragalo tse di tlang, kgotsa go go golaganya le motho. Kwala fela potso ya gago!",
        },
    },
    {
        keywords: ['products', 'produits', 'ditlhagiswa'],
        answers: {
            en: "We offer a wide range of AI solutions for businesses, including natural language processing, machine learning, and data analytics. Visit our products page for more details!",
            fr: "Nous offrons une large gamme de solutions d'IA pour les entreprises, y compris le traitement du langage naturel, l'apprentissage automatique et l'analyse de données. Visitez notre page produits pour plus de détails !",
            tn: "Re fana ka ditlhagiswa tsa AI tse dintsi mo dikgwebong, go akaretsa go baakanya puo ya tlwaelo, go ithuta ga metšhine, le go sekaseka datha. Etela letlhatlhobo la rona la ditlhagiswa go bona dintlha tse dingwe!",
        },
    },
    {
        keywords: ['events', 'événements', 'ditiragalo'],
        answers: {
            en: "We regularly host webinars, workshops, and seminars on the latest AI trends and our solutions. Check our events page for upcoming dates!",
            fr: "Nous organisons régulièrement des webinaires, des ateliers et des séminaires sur les dernières tendances en IA et nos solutions. Consultez notre page d'événements pour les dates à venir !",
            tn: "Re tshwara diboka tsa marang-rang, dithuto, le dithuto ka ga dikgopolo tsa AI le ditharabololo tsa rona. Leka letlhatlhobo la rona la ditiragalo go bona ditiragalo tse di tlang!",
        },
    },
];
// --- END OF MANDATORY DEFINITIONS ---


const ChatBot = ({ darkMode, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('en');
    const messagesEndRef = useRef(null);

    // Conditional render based on userRole
    if (userRole === 'admin') {
        return null; // If the user is an admin, don't render the chatbot at all
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (input.trim() === '') return;

        const userMessage = { sender: 'user', text: input.trim() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput('');

        setTimeout(() => {
            const botResponse = getBotResponse(userMessage.text);
            setMessages((prevMessages) => [...prevMessages, botResponse]);
        }, 500);
    };

    const getBotResponse = (userText) => {
        const lowerCaseText = userText.toLowerCase();

        // Check for handover trigger (keywords can be multi-lingual too)
        if (lowerCaseText.includes("human agent") || lowerCaseText.includes("talk to human") || lowerCaseText.includes("speak to someone") ||
            lowerCaseText.includes("agent humain") || lowerCaseText.includes("parler à un humain") || lowerCaseText.includes("parler à quelqu'un") ||
            lowerCaseText.includes("fetisetsa kwa go motho") || lowerCaseText.includes("bua le motho")) {
            return { sender: 'bot', text: commonPhrases[language].handover };
        }

        // Check FAQ
        for (const entry of FAQ) {
            if (entry.keywords.some(keyword => lowerCaseText.includes(keyword))) {
                return { sender: 'bot', text: entry.answers[language] || entry.answers['en'] };
            }
        }

        // Default responses based on language
        if (lowerCaseText.includes("hello") || lowerCaseText.includes("hi") || lowerCaseText.includes("bonjour") || lowerCaseText.includes("salut") || lowerCaseText.includes("dumela")) {
            return { sender: 'bot', text: commonPhrases[language].greeting };
        }
        if (lowerCaseText.includes("thank you") || lowerCaseText.includes("thanks") || lowerCaseText.includes("merci") || lowerCaseText.includes("kea leboga")) {
            return { sender: 'bot', text: commonPhrases[language].thanks };
        }
        if (lowerCaseText.includes("how are you") || lowerCaseText.includes("comment ça va") || lowerCaseText.includes("o tsogile jang")) {
            return { sender: 'bot', text: commonPhrases[language].how_are_you };
        }
        if (lowerCaseText.includes("what is your name") || lowerCaseText.includes("quel est ton nom") || lowerCaseText.includes("leina la gago ke mang")) {
            return { sender: 'bot', text: commonPhrases[language].my_name };
        }

        // If no match, suggest handover
        return { sender: 'bot', text: commonPhrases[language].unknown };
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        setMessages([]); // Clear messages when language changes
    };

    return (
        <div className="fixed bottom-4 right-4 z-[1000]">
            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-110 focus:outline-none
                    ${darkMode ? 'bg-yellow-400' : 'bg-indigo-600'}`}
                aria-label={isOpen ? "Close Chatbot" : "Open Chatbot"}
            >
                <FaRobot size={24} className={darkMode ? 'text-indigo-600' : 'text-yellow-400'} />
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 w-80 h-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="bg-primary dark:bg-gray-800 text-white p-3 rounded-t-lg flex items-center justify-between shadow-md">
                        <h3 className="text-lg font-semibold flex items-center">
                            <FaRobot className="mr-2" /> AI Assistant
                        </h3>
                        <div className="flex items-center space-x-2">
                            {/* Language selection buttons */}
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`text-sm px-2 py-1 rounded ${language === 'en' ? 'bg-white text-primary' : 'text-white hover:bg-opacity-80'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => handleLanguageChange('fr')}
                                className={`text-sm px-2 py-1 rounded ${language === 'fr' ? 'bg-white text-primary' : 'text-white hover:bg-opacity-80'}`}
                            >
                                FR
                            </button>
                            <button
                                onClick={() => handleLanguageChange('tn')}
                                className={`text-sm px-2 py-1 rounded ${language === 'tn' ? 'bg-white text-primary' : 'text-white hover:bg-opacity-80'}`}
                            >
                                TN
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-gray-200 ml-2"
                                aria-label="Close Chat"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                                <p>{commonPhrases[language].welcome_initial}</p>
                                <p className="text-sm mt-2">{commonPhrases[language].welcome_suggestion1}</p>
                                <p className="text-sm">{commonPhrases[language].welcome_suggestion2}</p>
                                <p className="text-sm">{commonPhrases[language].welcome_suggestion3}</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`mb-3 p-2 rounded-lg max-w-[80%] ${msg.sender === 'user'
                                            ? 'bg-blue-500 text-white ml-auto rounded-br-none'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                                        }`}
                                >
                                    {msg.sender === 'bot' && (
                                        <FaRobot className="inline-block mr-1 text-gray-600 dark:text-gray-400" size={14} />
                                    )}
                                    {msg.sender === 'user' && (
                                        <FaUserTie className="inline-block mr-1 text-blue-200" size={14} />
                                    )}
                                    {msg.text}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={language === 'en' ? 'Type your message...' : language === 'fr' ? 'Tapez votre message...' : 'Kwala molaetsa wa gago...'}
                            className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="ml-2 bg-primary text-white p-3 rounded-full hover:bg-opacity-90 focus:outline-none"
                            aria-label="Send Message"
                        >
                            <FaPaperPlane size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot; 