import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  adminButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
  },

  adminButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    gap: 10,
  },

  analyticsButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },

  card: {
    flex: 1,
    padding: 16,
    marginHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardNumber: {
    fontSize: 24,
    fontWeight: '700',
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  postsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default styles;
