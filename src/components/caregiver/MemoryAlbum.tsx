import React, { useState } from "react";
import { Plus, Trash2, Edit3, Check, X, Image as ImageIcon, Eye, Heart } from "lucide-react";
import { AlbumCategory, MemoryAlbumItem } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getMemoryAlbum, saveMemoryAlbumItem, deleteMemoryAlbumItem } from "../../utils/storage";

interface MemoryAlbumProps {
  patientId: string;
}

export const MemoryAlbum: React.FC<MemoryAlbumProps> = ({ patientId }) => {
  const { t } = useLanguage();
  const [album, setAlbum] = useState<MemoryAlbumItem[]>(() => getMemoryAlbum(patientId));
  const [selectedCategory, setSelectedCategory] = useState<AlbumCategory | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AlbumCategory>("family");
  const [person, setPerson] = useState("");
  const [relationship, setRelationship] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [enabledForGame, setEnabledForGame] = useState(true);

  const categories: { id: AlbumCategory | "all"; label: string }[] = [
    { id: "all", label: "All Photos" },
    { id: "family", label: "Family" },
    { id: "places", label: "Places" },
    { id: "events", label: "Events" },
    { id: "childhood", label: "Childhood" },
    { id: "work_life", label: "Work Life" },
    { id: "interests", label: "Interests" }
  ];

  const handleToggleGame = (item: MemoryAlbumItem) => {
    const updated = { ...item, enabledForGame: !item.enabledForGame };
    saveMemoryAlbumItem(updated);
    setAlbum(getMemoryAlbum(patientId));
  };

  const handleDelete = (id: string) => {
    deleteMemoryAlbumItem(id);
    setAlbum(getMemoryAlbum(patientId));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) return;

    const newItem: MemoryAlbumItem = {
      id: `ma-${Date.now()}`,
      patientId,
      category,
      title: title.trim(),
      image: image.trim(),
      person: person.trim() || undefined,
      relationship: relationship.trim() || undefined,
      year: year.trim() || undefined,
      description: description.trim() || undefined,
      enabledForGame
    };

    saveMemoryAlbumItem(newItem);
    setAlbum(getMemoryAlbum(patientId));
    setIsModalOpen(false);

    // Reset
    setTitle("");
    setPerson("");
    setRelationship("");
    setYear("");
    setDescription("");
    setImage("");
    setEnabledForGame(true);
  };

  const filteredAlbum =
    selectedCategory === "all" ? album : album.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("caretaker.albumTitle")}</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">{t("caretaker.albumSub")}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo to Album</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Album Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAlbum.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Photo View with Enable Badge */}
              <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleGame(item)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1 ${
                      item.enabledForGame
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-200"
                        : "bg-slate-800/80 text-white hover:bg-slate-900"
                    }`}
                  >
                    {item.enabledForGame ? <Check className="w-3 h-3" /> : null}
                    <span>{item.enabledForGame ? "Active in Game" : "Hidden from Game"}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                    {item.category}
                  </span>
                  {item.year && <span className="text-xs text-slate-500 font-bold">{item.year}</span>}
                </div>

                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>

                {item.person && (
                  <p className="text-xs font-semibold text-slate-700">
                    Person: {item.person}{" "}
                    {item.relationship && (
                      <span className="text-slate-500 font-normal">({item.relationship})</span>
                    )}
                  </p>
                )}

                {item.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>

            {/* Caretaker Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={item.enabledForGame}
                  onChange={() => handleToggleGame(item)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include in Family & Life Recall</span>
              </label>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Memory Album Photo</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title or Milestone *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grandson's Convocation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AlbumCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="family">Family</option>
                    <option value="places">Places</option>
                    <option value="events">Events</option>
                    <option value="childhood">Childhood</option>
                    <option value="work_life">Work Life</option>
                    <option value="interests">Interests</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Approximate Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2018"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Person Shown
                  </label>
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Daughter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Memory Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context to remember this photo."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableGame"
                  checked={enabledForGame}
                  onChange={(e) => setEnabledForGame(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="enableGame" className="text-xs font-bold text-blue-900 cursor-pointer">
                  Enable this photograph for the "Family & Life Recall" cognitive game
                </label>
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
