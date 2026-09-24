import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, CheckCircle2, User, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fetchedUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const grantSubscription = async (userId, months) => {
    try {
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      await updateDoc(doc(db, 'users', userId), {
        subscriptionUntil: date.toISOString()
      });
      fetchUsers(); // Refresh
      alert('Підписка успішно надана!');
    } catch (e) {
      console.error(e);
      alert('Помилка: ' + e.message);
    }
  };

  const revokeSubscription = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionUntil: null
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pb-32"
    >
      <div className="px-5 py-4 border-b border-[#2A2323] flex items-center justify-between sticky top-0 bg-[#000000]/80 backdrop-blur-md z-10">
        <h2 className="text-[#F4EFEA] text-xl font-bold flex items-center gap-2">
          <Crown className="text-[#D4AF37]" /> Панель Адміна
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
           <p className="text-[#8C7A7A] text-center mt-10">Завантаження...</p>
        ) : users.length === 0 ? (
           <p className="text-[#8C7A7A] text-center mt-10">Користувачів не знайдено</p>
        ) : (
          users.map(u => {
            const isPremium = u.subscriptionUntil && new Date(u.subscriptionUntil) > new Date();
            return (
              <div key={u.id} className="bg-[#1E1919] border border-[#2A2323] rounded-3xl p-5 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[#F4EFEA] font-bold text-lg">{u.name || 'Анонім'}</h3>
                    <p className="text-[#8C7A7A] text-xs mb-1">{u.email}</p>
                    <p className="text-xs uppercase tracking-widest font-bold">
                       {isPremium 
                         ? <span className="text-[#D4AF37] flex items-center gap-1"><CheckCircle2 size={12}/> Pro до {new Date(u.subscriptionUntil).toLocaleDateString()}</span>
                         : <span className="text-[#8C7A7A]">Безкоштовна</span>
                       }
                    </p>
                  </div>
                  {u.role === 'admin' && <span className="bg-red-500/20 text-red-500 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-lg">Admin</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 border-t border-[#2A2323] pt-4">
                  <button onClick={() => grantSubscription(u.id, 1)} className="bg-[#151212] text-[#D4AF37] py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#2A2323]">
                    +1 Місяць
                  </button>
                  <button onClick={() => grantSubscription(u.id, 12)} className="bg-[#151212] text-[#D4AF37] py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#2A2323]">
                    +1 Рік
                  </button>
                  {isPremium && (
                    <button onClick={() => revokeSubscription(u.id)} className="col-span-2 bg-red-500/10 text-red-500 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-500/20 mt-1">
                      Скасувати підписку
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
