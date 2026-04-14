import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, BookOpen, Mail, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const WHATSAPP_NUMBER = "258874559994"; // Mozambican number

const openWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  
  const [testimonialForm, setTestimonialForm] = useState({ name: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) {
        setSettings(snapshot.docs[0].data());
      }
    });
    const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts();
      unsubCourses();
      unsubSettings();
      unsubTestimonials();
    };
  }, []);

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...testimonialForm,
        createdAt: serverTimestamp()
      });
      setTestimonialForm({ name: '', text: '' });
      alert("Obrigado pelo seu depoimento!");
    } catch (error) {
      console.error("Error adding testimonial:", error);
      alert("Erro ao enviar depoimento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-bg/95 backdrop-blur-md shadow-sm py-3 border-b border-brand-green/10' : 'bg-transparent py-5 border-b border-brand-green/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('home')}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Naturalmente Chonguile Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-brand-gold font-bold text-xl">
                NC
              </div>
            )}
            <span className={`font-serif text-2xl italic tracking-wide ${isScrolled ? 'text-brand-green' : 'text-brand-green'}`}>
              Naturalmente Chonguile
            </span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {['Produtos', 'Cursos', 'Sobre', 'Depoimentos', 'Contacto'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className={`text-sm font-semibold uppercase tracking-widest hover:text-brand-gold transition-colors text-brand-text`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="text-brand-text" />
            ) : (
              <Menu className="text-brand-text" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-brand-bg pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col space-y-6 text-center">
              {['Produtos', 'Cursos', 'Sobre', 'Depoimentos', 'Contacto'].map((item) => (
                <button 
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase())}
                  className="text-2xl font-serif text-brand-text hover:text-brand-green transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-brand-green rounded-2xl h-[500px] relative overflow-hidden p-8 md:p-12 flex flex-col justify-end text-brand-bg">
          <div className="absolute inset-0 z-0">
            <img 
              src={settings.heroBgUrl || "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?q=80&w=2574&auto=format&fit=crop"} 
              alt="Mulher africana com cabelo natural" 
              className="w-full h-full object-cover object-top opacity-60 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-serif italic mb-6 leading-tight text-brand-bg"
            >
              {settings.heroTitle || 'Cuide do seu cabelo naturalmente'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-brand-bg/90 mb-8 max-w-xl"
            >
              {settings.heroSubtitle || 'Descubra o poder da natureza para um cabelo crespo e cacheado saudável, forte e radiante.'}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => scrollTo('produtos')}
                className="bg-brand-gold text-brand-bg px-8 py-3 rounded-full font-bold text-sm transition-all hover:bg-brand-gold/90 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Ver Catálogo
              </button>
              <button 
                onClick={() => scrollTo('cursos')}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-brand-bg px-8 py-3 rounded-full font-bold text-sm transition-all hover:bg-white/20 flex items-center justify-center gap-2"
              >
                <BookOpen size={18} />
                Ver Cursos
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produtos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center border-l-4 border-brand-gold pl-3 mb-8">
            <h2 className="text-2xl font-serif text-brand-green">Loja de Cosméticos</h2>
            <span className="text-xs text-brand-gold font-bold uppercase tracking-wider cursor-pointer hover:underline">Ver Todos &rarr;</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.length > 0 ? products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2"
              >
                <div className="h-32 bg-[#EDECE6] rounded-lg overflow-hidden flex items-center justify-center mb-2">
                  <img 
                    src={product.img} 
                    alt={product.name} 
                    className="w-full h-full object-cover mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="font-bold text-[15px] leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-1">{product.desc}</p>
                <div className="text-brand-gold font-bold mb-2">{product.price}</div>
                <button 
                  onClick={() => openWhatsApp(`Olá! Gostaria de comprar o produto: ${product.name} por ${product.price}.`)}
                  className="mt-auto bg-[#25D366] hover:bg-[#128C7E] text-white py-2 px-3 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 w-full"
                >
                  <MessageCircle size={14} />
                  Comprar no WhatsApp
                </button>
              </motion.div>
            )) : (
              <p className="text-sm text-gray-500 col-span-full">Nenhum produto disponível no momento.</p>
            )}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center border-l-4 border-brand-gold pl-3 mb-8">
            <h2 className="text-2xl font-serif text-brand-green">Nossos Cursos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.length > 0 ? courses.map((course, i) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-5 border-l-4 border-brand-green shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col"
              >
                <h3 className="font-bold text-sm mb-1.5">{course.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3 flex-grow">{course.desc}</p>
                <div className="text-brand-gold font-bold mb-3">{course.price}</div>
                <button 
                  onClick={() => openWhatsApp(`Olá! Quero me inscrever no curso: ${course.title}.`)}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-bg py-2 px-4 rounded-full text-sm font-bold transition-colors w-full"
                >
                  Inscrever-se
                </button>
              </motion.div>
            )) : (
              <p className="text-sm text-gray-500 col-span-full">Nenhum curso disponível no momento.</p>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center border-l-4 border-brand-gold pl-3 mb-8">
            <h2 className="text-2xl font-serif text-brand-green">Sobre Mim</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full md:w-1/3"
            >
              <img 
                src="https://images.unsplash.com/photo-1531123414708-1e1d19a474c5?q=80&w=1000&auto=format&fit=crop" 
                alt="Naturalmente Chonguile" 
                className="rounded-xl w-full object-cover aspect-square"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full md:w-2/3"
            >
              <div className="space-y-4 text-brand-text/80 text-sm leading-relaxed whitespace-pre-line">
                {settings.aboutText || `Olá! Sou a Chonguile. A minha jornada com o cabelo natural começou há 5 anos, quando decidi fazer o big chop e abraçar a minha verdadeira textura.

No início, foi frustrante. Não encontrava produtos adequados no mercado moçambicano e não sabia como cuidar dos meus fios. Foi então que comecei a estudar cosmetologia natural e a criar as minhas próprias misturas.

Hoje, a minha missão é ajudar outras mulheres a apaixonarem-se pelo seu cabelo natural, oferecendo produtos de alta qualidade e conhecimento prático através dos meus cursos.`}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center border-l-4 border-brand-gold pl-3 mb-8">
            <h2 className="text-2xl font-serif text-brand-green">O que dizem as nossas clientes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {testimonials.length > 0 ? testimonials.map((testimonial, i) => (
              <motion.div 
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-brand-gold/10 p-6 rounded-2xl italic text-sm text-[#444] leading-relaxed shadow-sm"
              >
                "{testimonial.text}"<br/>
                <strong className="mt-3 block font-sans not-italic text-brand-text">— {testimonial.name}</strong>
              </motion.div>
            )) : (
              <p className="text-sm text-gray-500 col-span-full">Seja a primeira a deixar um depoimento!</p>
            )}
          </div>

          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-brand-green/5">
            <h3 className="text-lg font-serif font-bold text-brand-green mb-6 text-center">Deixe o seu depoimento</h3>
            <form onSubmit={handleAddTestimonial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">O seu nome</label>
                <input 
                  required 
                  type="text" 
                  value={testimonialForm.name} 
                  onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})} 
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors" 
                  placeholder="Ex: Maria S."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">A sua experiência</label>
                <textarea 
                  required 
                  value={testimonialForm.text} 
                  onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})} 
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors" 
                  rows={4}
                  placeholder="Conte-nos o que achou dos produtos ou cursos..."
                ></textarea>
              </div>
              <button 
                disabled={isSubmitting} 
                type="submit" 
                className="w-full bg-brand-green text-white py-3 rounded-xl font-bold text-sm transition-colors hover:bg-brand-green/90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'A enviar...' : <><Send size={16} /> Enviar Depoimento</>}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8 pt-8">
        <footer id="contacto" className="bg-white rounded-2xl border border-brand-green/5 py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 text-[13px] text-brand-text">
            <span className="flex items-center gap-2"><Mail size={16} className="text-brand-gold"/> {settings.contactEmail || 'naturalmente.chonguile@gmail.com'}</span>
            <span className="flex items-center gap-2"><MessageCircle size={16} className="text-brand-green"/> {settings.contactPhone || '+258 87 455 9994'}</span>
          </div>
          <div className="flex gap-6 text-[13px]">
            <a href={settings.instagramUrl || "https://www.instagram.com/chonguilehairstudio?igsh=MXEzbGxsYjJ4dDLn&utm_source+qr"} target="_blank" rel="noopener noreferrer" className="text-brand-green font-semibold hover:text-brand-gold transition-colors">Instagram</a>
            <a href="#" className="text-brand-green font-semibold hover:text-brand-gold transition-colors">Facebook</a>
            <a href="#" className="text-brand-green font-semibold hover:text-brand-gold transition-colors">YouTube</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
