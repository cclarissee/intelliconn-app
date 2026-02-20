import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.45)', // darker glassy overlay
    zIndex: 9999,
    elevation: 50,
  },

  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    paddingTop: 56,
    paddingHorizontal: 20,

    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 25,
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  menuTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },

  socialText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 220,
  },

  closeButton: {
    backgroundColor: '#F1F5F9',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  menuBody: {
    flex: 1,
    marginTop: 12,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },

  navText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14,
    color: '#0F172A',
  },

  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 18,
    paddingBottom: 24,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerLeft: {
    flex: 1,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  userIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  userInfo: {
    justifyContent: 'center',
  },

  emailText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  signOutText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default styles;
