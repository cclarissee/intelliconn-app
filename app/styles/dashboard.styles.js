const { StyleSheet } = require('react-native');

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 16,
  backgroundColor: '#f9f9f9',
},

  floatingHeader: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  elevation: 10,
  backgroundColor: '#f9f9f9',
  padding: 16,
  paddingTop: 50,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    marginRight: 10,
    padding: 8,
  },
  hamburgerText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newPostButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
  },
  box: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  boxTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  boxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsSection: {
    marginTop: 20,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentPostText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  showAllButton: {
    padding: 8,
  },
  showAllText: {
    color: '#007bff',
    fontSize: 16,
  },
});

export default styles;
