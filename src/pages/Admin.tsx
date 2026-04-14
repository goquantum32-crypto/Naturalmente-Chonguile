import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Trash2, Edit2, LogOut, Settings, Package, BookOpen, Upload, MessageSquare } from 'lucide-react';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'courses' | 'settings' | 'testimonials'>('products');

  const [products, setProducts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', price: '', desc: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', price: '', desc: '' });
  const [settingsForm, setSettingsForm] = useState({ heroTitle: '', heroSubtitle: '', aboutText: '', contactEmail: '', contactPhone: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroBgFile, setHeroBgFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSettings({ id: snapshot.docs[0].id, ...data });
        setSettingsForm({
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          aboutText: data.aboutText || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || ''
        });
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
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <h1 className="text-2xl font-serif font-bold text-brand-green mb-6">Área de Administração</h1>
          <p className="text-sm text-gray-600 mb-8">Faça login com sua conta Google para acessar o painel de controle.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-brand-gold text-brand-bg py-3 rounded-xl font-bold hover:bg-brand-gold/90 transition-colors"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Por favor, selecione uma imagem para o produto.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save product to Firestore with the image URL
      await addDoc(collection(db, 'products'), {
        ...productForm,
        img: downloadURL,
        createdAt: serverTimestamp()
      });
      
      setProductForm({ name: '', price: '', desc: '' });
      setImageFile(null);
      // Reset file input
      const fileInput = document.getElementById('product-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Erro ao adicionar produto. Verifique se você tem permissão de administrador.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'courses'), {
        ...courseForm,
        createdAt: serverTimestamp()
      });
      setCourseForm({ title: '', price: '', desc: '' });
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Erro ao adicionar curso. Verifique se você tem permissão de administrador.");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este depoimento?')) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
      } catch (error) {
        console.error("Error deleting testimonial:", error);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let updatedSettings = { ...settingsForm } as any;

      if (logoFile) {
        const logoRef = ref(storage, `settings/logo_${Date.now()}_${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        updatedSettings.logoUrl = await getDownloadURL(logoRef);
      }

      if (heroBgFile) {
        const bgRef = ref(storage, `settings/bg_${Date.now()}_${heroBgFile.name}`);
        await uploadBytes(bgRef, heroBgFile);
        updatedSettings.heroBgUrl = await getDownloadURL(bgRef);
      }

      if (settings.id) {
        await updateDoc(doc(db, 'settings', settings.id), updatedSettings);
      } else {
        await addDoc(collection(db, 'settings'), updatedSettings);
      }
      
      alert("Configurações salvas com sucesso!");
      setLogoFile(null);
      setHeroBgFile(null);
      
      const logoInput = document.getElementById('logo-image') as HTMLInputElement;
      if (logoInput) logoInput.value = '';
      const bgInput = document.getElementById('bg-image') as HTMLInputElement;
      if (bgInput) bgInput.value = '';

    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-brand-green">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Package size={18} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'courses' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen size={18} /> Cursos
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings size={18} /> Configurações
          </button>
          <button 
            onClick={() => setActiveTab('testimonials')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'testimonials' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageSquare size={18} /> Depoimentos
          </button>
        </nav>

        <button 
          onClick={logout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'products' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-brand-green mb-6">Gerenciar Produtos</h2>
            
            <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <h3 className="text-lg font-bold mb-4">Adicionar Novo Produto</h3>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Produto</label>
                <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preço (ex: 750 MT)</label>
                <input required type="text" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-bold text-gray-700 mb-1">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 hover:border-brand-green p-4 rounded-lg flex flex-col items-center justify-center transition-colors">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      {imageFile ? imageFile.name : 'Clique para selecionar uma imagem'}
                    </span>
                    <input 
                      id="product-image"
                      type="file" 
                      accept="image/*" 
                      required 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }} 
                    />
                  </label>
                  {imageFile && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <textarea required value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} className="w-full p-2 border rounded-lg text-sm" rows={3}></textarea>
              </div>
              <div className="col-span-full flex justify-end">
                <button disabled={isUploading} type="submit" className="bg-brand-gold text-brand-bg px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                  {isUploading ? 'A enviar...' : <><Plus size={16} /> Adicionar</>}
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 font-medium">Imagem</th>
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">Preço</th>
                    <th className="p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-t border-gray-100">
                      <td className="p-4">
                        <img src={product.img} alt={product.name} className="w-12 h-12 rounded object-cover" />
                      </td>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-gray-600">{product.price}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">Nenhum produto cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-brand-green mb-6">Gerenciar Cursos</h2>
            
            <form onSubmit={handleAddCourse} className="bg-white p-6 rounded-2xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <h3 className="text-lg font-bold mb-4">Adicionar Novo Curso</h3>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Título do Curso</label>
                <input required type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preço (ex: 1.500 MT)</label>
                <input required type="text" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <textarea required value={courseForm.desc} onChange={e => setCourseForm({...courseForm, desc: e.target.value})} className="w-full p-2 border rounded-lg text-sm" rows={3}></textarea>
              </div>
              <div className="col-span-full flex justify-end">
                <button type="submit" className="bg-brand-gold text-brand-bg px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                  <Plus size={16} /> Adicionar
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 font-medium">Título</th>
                    <th className="p-4 font-medium">Preço</th>
                    <th className="p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} className="border-t border-gray-100">
                      <td className="p-4 font-medium">{course.title}</td>
                      <td className="p-4 text-gray-600">{course.price}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">Nenhum curso cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-brand-green mb-6">Configurações do Site</h2>
            
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Título Principal (Hero)</label>
                <input type="text" value={settingsForm.heroTitle} onChange={e => setSettingsForm({...settingsForm, heroTitle: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="Cuide do seu cabelo naturalmente" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtítulo (Hero)</label>
                <textarea value={settingsForm.heroSubtitle} onChange={e => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})} className="w-full p-2 border rounded-lg text-sm" rows={2} placeholder="Descubra o poder da natureza..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Texto "Sobre Mim"</label>
                <textarea value={settingsForm.aboutText} onChange={e => setSettingsForm({...settingsForm, aboutText: e.target.value})} className="w-full p-2 border rounded-lg text-sm" rows={6}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email de Contacto</label>
                  <input type="email" value={settingsForm.contactEmail} onChange={e => setSettingsForm({...settingsForm, contactEmail: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone (WhatsApp)</label>
                  <input type="text" value={settingsForm.contactPhone} onChange={e => setSettingsForm({...settingsForm, contactPhone: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Imagens do Site</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Logotipo (Substitui o "NC")</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 hover:border-brand-green p-3 rounded-lg flex items-center justify-center transition-colors">
                        <Upload size={18} className="text-gray-400 mr-2" />
                        <span className="text-xs text-gray-600 font-medium">
                          {logoFile ? logoFile.name : 'Selecionar novo logotipo'}
                        </span>
                        <input 
                          id="logo-image"
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLogoFile(e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                      {logoFile ? (
                        <div className="w-12 h-12 rounded overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      ) : settings.logoUrl ? (
                        <div className="w-12 h-12 rounded overflow-hidden border border-gray-200">
                          <img src={settings.logoUrl} alt="Atual" className="w-full h-full object-contain" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Imagem de Fundo (Banner Inicial)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 hover:border-brand-green p-3 rounded-lg flex items-center justify-center transition-colors">
                        <Upload size={18} className="text-gray-400 mr-2" />
                        <span className="text-xs text-gray-600 font-medium">
                          {heroBgFile ? heroBgFile.name : 'Selecionar nova imagem de fundo'}
                        </span>
                        <input 
                          id="bg-image"
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setHeroBgFile(e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                      {heroBgFile ? (
                        <div className="w-16 h-12 rounded overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(heroBgFile)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : settings.heroBgUrl ? (
                        <div className="w-16 h-12 rounded overflow-hidden border border-gray-200">
                          <img src={settings.heroBgUrl} alt="Atual" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button disabled={isUploading} type="submit" className="bg-brand-green text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
                  {isUploading ? 'A guardar...' : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-brand-green mb-6">Gerenciar Depoimentos</h2>
            
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">Depoimento</th>
                    <th className="p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map(t => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="p-4 font-medium whitespace-nowrap">{t.name}</td>
                      <td className="p-4 text-gray-600">{t.text}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteTestimonial(t.id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {testimonials.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">Nenhum depoimento cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
