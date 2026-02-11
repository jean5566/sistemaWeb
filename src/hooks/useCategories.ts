import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/http';
import { Category } from '../types/models';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const data = await api.get<Category[]>('categories.php');
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                console.error('Categorías format invalid:', data);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const addCategory = async (name: string) => {
        try {
            const data = await api.post<Category>('categories.php', { name });
            setCategories([...categories, data]);
            toast.success('Categoría agregada');
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Error al agregar categoría');
        }
    };

    const removeCategory = async (id: string | number) => {
        try {
            await api.delete(`categories.php?id=${id}`);
            setCategories(categories.filter(cat => cat.id !== id));
            toast.success('Categoría eliminada');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Error al eliminar categoría');
        }
    };

    return {
        categories,
        loading,
        addCategory,
        removeCategory
    };
}
