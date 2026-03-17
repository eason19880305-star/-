import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Note {
  id: number;
  title: string;
  content: string;
}

export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(`/api/notes/${id}`);
        setNote(res.data);
      } catch (error) {
        console.error('找不到记忆', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const goBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F2E4E9] text-[#5F5F60] text-2xl">
        正在潜入深海读取记忆...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#F2E4E9] text-[#5F5F60] text-2xl">
        <p>记忆已丢失</p>
        <button
          onClick={goBack}
          className="mt-10 px-8 py-3 bg-[#e88da5] text-white border-none rounded-lg cursor-pointer hover:bg-[#ffafc5] transition-colors"
        >
          返回深海
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2E4E9] py-12 px-4 font-sans">
      <div className="max-w-[800px] mx-auto p-10 bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <h1 className="text-4xl text-[#545455] font-light mb-4 text-center">
          {note.title}
        </h1>
        <div className="text-sm text-gray-400 text-center mb-6">
          记忆编号：{id}
        </div>
        <hr className="border-gray-100 mb-8" />
        <p className="text-[22px] leading-loose whitespace-pre-wrap text-[#333]">
          {note.content}
        </p>

        <div className="mt-12 text-center">
          <button
            onClick={goBack}
            className="px-8 py-3 bg-[#e88da5] text-white border-none rounded-lg cursor-pointer hover:bg-[#ffafc5] transition-colors text-lg"
          >
            返回深海
          </button>
        </div>
      </div>
    </div>
  );
}
