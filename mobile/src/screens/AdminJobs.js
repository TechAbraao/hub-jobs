import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { createJob, deleteJob, deleteUser, listJobs, listUsers, updateJob } from '../services/jobsApi';


const EMPTY_FORM = {
  title: '',
  description: '',
  company: '',
  location: '',
  url: '',
  platform: '',
  salary: '',
};

export default function AdminJobs({ onBack }) {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [activeScreen, setActiveScreen] = useState('form');
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPagination, setJobsPagination] = useState({ total: 0, page: 1, per_page: 10, pages: 1 });
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, per_page: 10, pages: 1 });

  async function loadJobs(term = '', page = 1) {
    try {
      setLoadingJobs(true);
      const response = await listJobs({ page, per_page: 10, q: term || undefined });
      setJobs(response.jobs || []);
      setJobsPage(Number(response?.pagination?.page || page));
      setJobsPagination(response?.pagination || {
        total: response.jobs?.length || 0,
        page,
        per_page: 10,
        pages: 1,
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as vagas.');
    } finally {
      setLoadingJobs(false);
    }
  }

  async function loadUsers(term = '', page = 1) {
    try {
      setLoadingUsers(true);
      const response = await listUsers({ page, per_page: 10, q: term || undefined });
      setUsers(response.users || []);
      setUsersPage(Number(response?.pagination?.page || page));
      setUsersPagination(response?.pagination || {
        total: response.users?.length || 0,
        page,
        per_page: 10,
        pages: 1,
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    document.title = "HubJobs | Administrativo";
    loadJobs();
    loadUsers();
  }, []);

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function openCreateScreen() {
    setActiveScreen('form');
    setError('');
    setSuccess('');
  }

  function openJobsListScreen() {
    setActiveScreen('jobs');
    setError('');
    setSuccess('');
    loadJobs(jobSearch, 1);
  }

  function openUsersListScreen() {
    setActiveScreen('users');
    setError('');
    setSuccess('');
    loadUsers(userSearch, 1);
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      url: form.url.trim(),
      platform: form.platform.trim(),
      salary: form.salary === '' ? null : Number(form.salary),
    };

    if (!payload.title || !payload.description || !payload.company || !payload.location || !payload.url || !payload.platform) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (Number.isNaN(payload.salary)) {
      setError('O salário deve ser um número válido.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await updateJob(editingId, payload);
        setSuccess('Vaga atualizada com sucesso.');
      } else {
        await createJob(payload);
        setSuccess('Vaga criada com sucesso.');
      }
      await loadJobs(jobSearch, 1);
      resetForm();
      setActiveScreen('jobs');
    } catch (err) {
      setError(err.message || 'Não foi possível salvar essa vaga.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDialog(title, message) {
    if (Platform.OS === 'web') {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }
    return new Promise(resolve => {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }

  async function handleDelete(job) {
    const id = job?.id;

    if (id === undefined || id === null || id === '') {
      setError('Não foi possível identificar a vaga para exclusão.');
      return;
    }

    const confirmed = await confirmDialog(
      'Remover vaga',
      `Deseja excluir a vaga "${job.title || 'esta vaga'}"?`,
    );
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteJob(id);
      setJobs(current => current.filter(item => String(item.id) !== String(id)));
      await loadJobs(jobSearch, jobsPage);
      setSuccess('Vaga removida com sucesso.');
    } catch (err) {
      console.warn('Erro ao excluir:', err);
      setError(err.message || 'Não foi possível excluir a vaga.');
    }
  }

  async function handleIsActivedUser(user) {
    const id = user?.id;

    if (id === undefined || id === null || id === '') {
      setError('Não foi possível identificar o usuário para ativação/desativação.');
      return;
    }

    const confirmed = await confirmDialog(
      'Ativar/Desativar usuário',
      `Deseja ativar/desativar o usuário "${user.username || 'este usuário'}"?`,
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await None
      setUsers(current => current.filter(item => String(item.id) !== String(id)));
      await loadUsers(userSearch, usersPage);
      setSuccess('Usuário ativado/desativado com sucesso.');
    } catch (err) {
      console.warn('Erro ao ativar/desativar usuário:', err);
      setError(err.message || 'Não foi possível ativar/desativar o usuário.');
    }
  }

  async function handleDeleteUser(user) {
    const id = user?.id;

    if (id === undefined || id === null || id === '') {
      setError('Não foi possível identificar o usuário para exclusão.');
      return;
    }

    const confirmed = await confirmDialog(
      'Remover usuário',
      `Deseja excluir o usuário "${user.username || 'este usuário'}"?`,
    );
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteUser(id);
      setUsers(current => current.filter(item => String(item.id) !== String(id)));
      await loadUsers(userSearch, usersPage);
      setSuccess('Usuário removido com sucesso.');
    } catch (err) {
      console.warn('Erro ao excluir usuário:', err);
      setError(err.message || 'Não foi possível excluir o usuário.');
    }
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      description: job.description || '',
      company: job.company || '',
      location: job.location || '',
      url: job.url || '',
      platform: job.platform || '',
      salary: job.salary == null ? '' : String(job.salary),
    });
    setActiveScreen('form');
    setError('');
    setSuccess('');
  }

  const renderFormScreen = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>{editingId ? 'Editar vaga' : 'Adicionar vaga'}</Text>

      <TextInput
        value={form.title}
        onChangeText={value => updateField('title', value)}
        placeholder="Título da vaga"
        style={styles.input}
      />
      <TextInput
        value={form.company}
        onChangeText={value => updateField('company', value)}
        placeholder="Empresa"
        style={styles.input}
      />
      <TextInput
        value={form.location}
        onChangeText={value => updateField('location', value)}
        placeholder="Localização"
        style={styles.input}
      />
      <TextInput
        value={form.platform}
        onChangeText={value => updateField('platform', value)}
        placeholder="Plataforma (LinkedIn, Indeed, etc.)"
        style={styles.input}
      />
      <TextInput
        value={form.url}
        onChangeText={value => updateField('url', value)}
        placeholder="URL da vaga"
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={form.salary}
        onChangeText={value => updateField('salary', value)}
        placeholder="Salário (opcional)"
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        value={form.description}
        onChangeText={value => updateField('description', value)}
        placeholder="Descrição"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        style={[styles.input, styles.textArea]}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar vaga'}</Text>
        </TouchableOpacity>

        {editingId ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={openJobsListScreen}>
            <Text style={styles.secondaryButtonText}>Ver vagas</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderJobsListScreen = () => (
    <>
      <View style={styles.listHeader}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Vagas cadastradas</Text>
          <TouchableOpacity style={styles.newJobButton} onPress={openCreateScreen}>
            <Text style={styles.newJobButtonText}>+ Nova vaga</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={jobSearch}
          onChangeText={async value => {
            setJobSearch(value);
            await loadJobs(value, 1);
          }}
          placeholder="Buscar por título ou empresa"
          style={styles.searchInput}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {loadingJobs ? (
        <Text style={styles.emptyState}>Carregando vagas...</Text>
      ) : jobs.length === 0 ? (
        <Text style={styles.emptyState}>Nenhuma vaga cadastrada ainda.</Text>
      ) : (
        <>
          {jobs.map(job => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobMeta}>{job.company}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(job)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={18} color="#0D2347" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(job)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={18} color="#C23616" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.jobText}>{job.location}</Text>
              <Text style={styles.jobText}>{job.platform}</Text>
              {job.salary != null ? <Text style={styles.jobSalary}>R$ {Number(job.salary).toLocaleString('pt-BR')}</Text> : null}
              <Text numberOfLines={3} style={styles.jobDescription}>{job.description}</Text>
            </View>
          ))}

          {jobsPagination.pages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationButton, jobsPage <= 1 && styles.paginationButtonDisabled]}
                onPress={() => jobsPage > 1 && loadJobs(jobSearch, jobsPage - 1)}
                disabled={jobsPage <= 1}
              >
                <Text style={[styles.paginationButtonText, jobsPage <= 1 && styles.paginationButtonTextDisabled]}>Anterior</Text>
              </TouchableOpacity>

              <Text style={styles.paginationLabel}>Página {jobsPage} / {jobsPagination.pages}</Text>

              <TouchableOpacity
                style={[styles.paginationButton, jobsPage >= jobsPagination.pages && styles.paginationButtonDisabled]}
                onPress={() => jobsPage < jobsPagination.pages && loadJobs(jobSearch, jobsPage + 1)}
                disabled={jobsPage >= jobsPagination.pages}
              >
                <Text style={[styles.paginationButtonText, jobsPage >= jobsPagination.pages && styles.paginationButtonTextDisabled]}>Próxima</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </>
  );

  const renderUsersListScreen = () => (
    <>
      <View style={styles.listHeader}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Usuários cadastrados</Text>
        </View>

        <TextInput
          value={userSearch}
          onChangeText={async value => {
            setUserSearch(value);
            await loadUsers(value, 1);
          }}
          placeholder="Buscar por usuário"
          style={styles.searchInput}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {loadingUsers ? (
        <Text style={styles.emptyState}>Carregando usuários...</Text>
      ) : users.length === 0 ? (
        <Text style={styles.emptyState}>Nenhum usuário cadastrado ainda.</Text>
      ) : (
        <>
          {users.map(user => (
            <View key={user.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{user.username}</Text>
                  <Text style={styles.jobMeta}>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleIsActivedUser(user)} style={styles.iconButton}>
                    <Ionicons name="checkbox" size={18} color="#1621c2" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleDeleteUser(user)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={18} color="#C23616" />
                  </TouchableOpacity>
                </View>

              </View>

              <Text style={styles.jobText}>Favoritos: {Array.isArray(user.favorite_jobs) ? user.favorite_jobs.length : 0}</Text>
              <Text style={styles.jobText}>ID: {user.id}</Text>
              {/** Adicionar uma personalização se caso for TRUE ou FALSE no status do usuário */}
              <Text style={styles.jobText}>Status: {user.is_active}</Text>
            </View>
          ))}

          {usersPagination.pages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationButton, usersPage <= 1 && styles.paginationButtonDisabled]}
                onPress={() => usersPage > 1 && loadUsers(userSearch, usersPage - 1)}
                disabled={usersPage <= 1}
              >
                <Text style={[styles.paginationButtonText, usersPage <= 1 && styles.paginationButtonTextDisabled]}>Anterior</Text>
              </TouchableOpacity>

              <Text style={styles.paginationLabel}>Página {usersPage} / {usersPagination.pages}</Text>

              <TouchableOpacity
                style={[styles.paginationButton, usersPage >= usersPagination.pages && styles.paginationButtonDisabled]}
                onPress={() => usersPage < usersPagination.pages && loadUsers(userSearch, usersPage + 1)}
                disabled={usersPage >= usersPagination.pages}
              >
                <Text style={[styles.paginationButtonText, usersPage >= usersPagination.pages && styles.paginationButtonTextDisabled]}>Próxima</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#0D2347" />
        </TouchableOpacity>
        <Text style={styles.title}>Painel administrativo</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeScreen === 'form' && styles.activeTabButton]}
            onPress={openCreateScreen}
          >
            <Text style={[styles.tabButtonText, activeScreen === 'form' && styles.activeTabButtonText]}>
              Adicionar Vaga
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeScreen === 'jobs' && styles.activeTabButton]}
            onPress={openJobsListScreen}
          >
            <Text style={[styles.tabButtonText, activeScreen === 'jobs' && styles.activeTabButtonText]}>
              Todas as Vagas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeScreen === 'users' && styles.activeTabButton]}
            onPress={openUsersListScreen}
          >
            <Text style={[styles.tabButtonText, activeScreen === 'users' && styles.activeTabButtonText]}>
              Usuários
            </Text>
          </TouchableOpacity>
        </View>

        {activeScreen === 'form' ? renderFormScreen() : activeScreen === 'jobs' ? renderJobsListScreen() : renderUsersListScreen()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBF5',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D2347',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D2347',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#DCE5F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 14,
    color: '#182A41',
  },
  textArea: {
    minHeight: 120,
  },
  buttonRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1647C5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#EAF0FD',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
  },
  secondaryButtonText: {
    color: '#1647C5',
    fontWeight: '700',
  },
  errorText: {
    color: '#C23616',
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  successText: {
    color: '#146C43',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCE5F2',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#1647C5',
  },
  tabButtonText: {
    color: '#0D2347',
    fontWeight: '700',
    fontSize: 12,
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  listHeader: {
    marginTop: 22,
    marginBottom: 8,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newJobButton: {
    backgroundColor: '#EAF0FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newJobButtonText: {
    color: '#1647C5',
    fontWeight: '700',
    fontSize: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DDEA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EDF8',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  jobTitle: {
    color: '#102B56',
    fontSize: 16,
    fontWeight: '700',
  },
  jobMeta: {
    color: '#53657B',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  jobText: {
    color: '#42566E',
    fontSize: 13,
    marginBottom: 2,
  },
  jobSalary: {
    color: '#0F7A52',
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
  },
  jobDescription: {
    color: '#4E607A',
    fontSize: 12,
    lineHeight: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  paginationButton: {
    flex: 1,
    backgroundColor: '#1647C5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#E7EBF4',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  paginationButtonTextDisabled: {
    color: '#7A8698',
  },
  paginationLabel: {
    fontSize: 12,
    color: '#364B73',
    fontWeight: '700',
    marginHorizontal: 8,
  },
  emptyState: {
    textAlign: 'center',
    color: '#73839A',
    marginVertical: 18,
  },
});
