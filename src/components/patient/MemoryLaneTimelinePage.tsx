import React, { useState } from "react";
import { Plus, Calendar, MapPin, Tag, Image as ImageIcon, X, Check } from "lucide-react";
import { Patient, MemoryLaneMemory } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getMemoriesTimeline, saveTimelineMemory } from "../../utils/storage";
import { SpeakButton } from "../common/SpeakButton";

interface MemoryLaneTimelinePageProps {
  patient: Patient;
}

export const MemoryLaneTimelinePage: React.FC<MemoryLaneTimelinePageProps> = ({ patient }) => {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<MemoryLaneMemory[]>(() =>
    getMemoriesTimeline(patient.id)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Memory Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [culturalCategory, setCulturalCategory] = useState("Festivals & Tradition");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMemory: MemoryLaneMemory = {
      id: `ml-${Date.now()}`,
      patientId: patient.id,
      title: title.trim(),
      date: date.trim() || "Recent Memory",
      location: location.trim() || "Family Home",
      culturalCategory,
      description: description.trim(),
      image:
        imageUrl.trim() ||
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
    };

    saveTimelineMemory(newMemory);
    setMemories(getMemoriesTimeline(patient.id));
    setIsModalOpen(false);

    // Reset Form
    setTitle("");
    setDate("");
    setLocation("");
    setDescription("");
    setImageUrl("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Memory Lane</h1>
            <SpeakButton text="Memory Lane. A visual album of your cherished life events, family celebrations, and cultural heritage." id="ml-timeline-speak" size="sm" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Cherished milestones, cultural events, and joyful memories to browse and share.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Memory</span>
        </button>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map((mem) => {
          const speechContent = `${mem.title}. Date: ${mem.date}. Location: ${mem.location}. Category: ${mem.culturalCategory}. Description: ${mem.description}`;

          return (
            <div
              key={mem.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Photo */}
                {mem.image && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={mem.image}
                      alt={mem.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {mem.culturalCategory}
                    </span>
                    <SpeakButton text={speechContent} id={`mem-speak-${mem.id}`} size="sm" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{mem.title}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mem.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mem.location}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {mem.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add a Cherished Memory</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Memory Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Family Celebration"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date / Year
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. October 2024"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kolkata, West Bengal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={culturalCategory}
                  onChange={(e) => setCulturalCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Festivals & Tradition">Festivals & Tradition</option>
                  <option value="Music & Performing Arts">Music & Performing Arts</option>
                  <option value="Heritage & Travel">Heritage & Travel</option>
                  <option value="Family Celebrations">Family Celebrations</option>
                  <option value="Work & Life Achievements">Work & Life Achievements</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Story & Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What made this moment special? Who was with you?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm cursor-pointer"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
